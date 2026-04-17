import {
  type AvailabilityProperty,
  type BookingProvider,
  type PropertyCatalogEntry,
  createBookingProvider,
} from "@wanderlust/providers/booking";
import { createLogger } from "@wanderlust/shared-logging";
import { buildMetricEvent } from "@wanderlust/shared-observability";
import type {
  CandidateDateWindow,
  LodgingOfferSummary,
  TripStaySearchInput,
  TripStaySearchResult,
} from "@wanderlust/shared-schemas";

import { loadTripWorkspaceById, updateTripWorkspace } from "../../trips/src/repo";
import type { TripWorkspace } from "../../trips/src/types";
import {
  bookingRail,
  maxAvailabilityPropertyIds,
  maxBlendedOffers,
  maxCandidateDateWindows,
  preferredWeekendCheckinDays,
} from "./config";
import {
  loadDestinationInventorySource,
  loadSelectedStayByTripId,
  upsertSelectedStay,
} from "./repo";
import type { DestinationInventorySource, SelectedStay } from "./types";

const logger = createLogger("bookings.service", {
  includeTrace: true,
});

export type BookingServiceErrorCode =
  | "trip_not_found"
  | "destination_not_found"
  | "missing_region_mapping"
  | "availability_upstream_failure";

export class BookingServiceError extends Error {
  code: BookingServiceErrorCode;

  constructor(
    code: BookingServiceErrorCode,
    message: string,
    options?: {
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "BookingServiceError";
    this.code = code;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

const formatWindowLabel = (checkin: Date, checkout: Date) => {
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return `${dayFormatter.format(checkin)} - ${dayFormatter.format(checkout)}`;
};

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const budgetWeights = {
  lean: {
    price: 0.65,
    quality: 0.2,
    refundability: 0.15,
  },
  balanced: {
    price: 0.45,
    quality: 0.35,
    refundability: 0.2,
  },
  luxury: {
    price: 0.15,
    quality: 0.6,
    refundability: 0.25,
  },
} as const;

const refundabilityScore = {
  refundable: 1,
  partially_refundable: 0.7,
  unknown: 0.4,
  non_refundable: 0.1,
} as const;

export const buildCandidateDateWindows = (
  travelMonth: string,
  tripNights: number,
): CandidateDateWindow[] => {
  const [yearPart, monthPart] = travelMonth.split("-").map(Number);
  const year = yearPart ?? Number.NaN;
  const month = monthPart ?? Number.NaN;

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return [];
  }

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const windows: CandidateDateWindow[] = [];

  for (const weekday of preferredWeekendCheckinDays) {
    for (let day = 1; day <= lastDay; day += 1) {
      const checkin = new Date(Date.UTC(year, month - 1, day));
      if (checkin.getUTCDay() !== weekday) {
        continue;
      }

      const checkout = addDays(checkin, tripNights);
      if (checkout.getUTCMonth() !== checkin.getUTCMonth()) {
        continue;
      }

      windows.push({
        id: `${formatDate(checkin)}_${formatDate(checkout)}`,
        label: formatWindowLabel(checkin, checkout),
        checkin: formatDate(checkin),
        checkout: formatDate(checkout),
        nights: tripNights,
      });

      if (windows.length >= maxCandidateDateWindows) {
        return windows;
      }
    }
  }

  return windows;
};

const buildQualitySignal = (offer: LodgingOfferSummary) => {
  const reviewScore =
    offer.reviewScore === null ? 0.5 : Math.max(0, Math.min(offer.reviewScore / 10, 1));
  const starRating =
    offer.starRating === null ? 0.5 : Math.max(0, Math.min(offer.starRating / 5, 1));
  return reviewScore * 0.65 + starRating * 0.35;
};

export const rankStayOffers = (
  offers: LodgingOfferSummary[],
  budgetStyle: TripWorkspace["budgetStyle"],
) => {
  if (offers.length <= 1) {
    return offers;
  }

  const minPrice = Math.min(...offers.map((offer) => offer.totalPrice));
  const maxPrice = Math.max(...offers.map((offer) => offer.totalPrice));
  const weights = budgetWeights[budgetStyle];

  return [...offers].sort((left, right) => {
    const scoreOffer = (offer: LodgingOfferSummary) => {
      const priceScore =
        maxPrice === minPrice ? 1 : 1 - (offer.totalPrice - minPrice) / (maxPrice - minPrice);

      return (
        priceScore * weights.price +
        buildQualitySignal(offer) * weights.quality +
        refundabilityScore[offer.currentRefundability] * weights.refundability
      );
    };

    return scoreOffer(right) - scoreOffer(left) || left.totalPrice - right.totalPrice;
  });
};

const buildOfferSummary = ({
  propertyId,
  window,
  catalogEntry,
  availability,
}: {
  propertyId: string;
  window: CandidateDateWindow;
  catalogEntry: PropertyCatalogEntry | undefined;
  availability: AvailabilityProperty;
}): LodgingOfferSummary | null => {
  const offer = availability.offers[0];
  if (!offer) {
    return null;
  }

  return {
    provider: bookingRail,
    windowId: window.id,
    windowLabel: window.label,
    checkin: window.checkin,
    checkout: window.checkout,
    nights: window.nights,
    propertyId,
    roomId: offer.roomId,
    rateId: offer.rateId,
    propertyName: catalogEntry?.propertyName ?? `Property ${propertyId}`,
    roomName: offer.roomName,
    imageUrl: catalogEntry?.imageUrl ?? null,
    addressLine1: catalogEntry?.addressLine1 ?? null,
    city: catalogEntry?.city ?? null,
    countryCode: catalogEntry?.countryCode ?? null,
    starRating: catalogEntry?.starRating ?? null,
    reviewScore: catalogEntry?.reviewScore ?? null,
    totalPrice: offer.totalPrice,
    nightlyPrice: offer.nightlyPrice,
    currency: offer.currency,
    cancellationSummary: offer.cancellationSummary,
    currentRefundability: offer.currentRefundability,
    amenities: catalogEntry?.amenities ?? [],
  };
};

type BookingServiceDependencies = {
  provider?: BookingProvider;
  loadTripWorkspace?: typeof loadTripWorkspaceById;
  updateTrip?: typeof updateTripWorkspace;
  loadDestinationSource?: typeof loadDestinationInventorySource;
  loadSelectedStay?: typeof loadSelectedStayByTripId;
  saveSelectedStay?: typeof upsertSelectedStay;
};

export const createBookingService = ({
  provider = createBookingProvider(),
  loadTripWorkspace = loadTripWorkspaceById,
  updateTrip = updateTripWorkspace,
  loadDestinationSource = loadDestinationInventorySource,
  loadSelectedStay = loadSelectedStayByTripId,
  saveSelectedStay = upsertSelectedStay,
}: BookingServiceDependencies = {}) => ({
  async searchTripStays(
    tripDraftId: string,
    input: TripStaySearchInput,
  ): Promise<TripStaySearchResult> {
    const tripDraft = await loadTripWorkspace(tripDraftId);
    if (!tripDraft) {
      throw new BookingServiceError("trip_not_found", `Trip draft ${tripDraftId} was not found.`);
    }

    const destination = await loadDestinationSource(tripDraft.destinationId);
    if (!destination) {
      throw new BookingServiceError(
        "destination_not_found",
        `Destination ${tripDraft.destinationId} was not found.`,
      );
    }

    if (!destination.expediaRegionId) {
      throw new BookingServiceError(
        "missing_region_mapping",
        `Destination ${destination.destinationId} is missing an Expedia region mapping.`,
      );
    }

    const candidateWindows = buildCandidateDateWindows(input.travelMonth, input.tripNights);

    await updateTrip(tripDraftId, {
      travelMonth: input.travelMonth,
      tripNights: input.tripNights,
      adults: input.adults,
    });

    if (candidateWindows.length === 0) {
      return {
        candidateWindows,
        offers: [],
      };
    }

    try {
      const propertyIds = await provider.listRegionPropertyIds(destination.expediaRegionId, {
        limit: maxAvailabilityPropertyIds,
      });
      const propertyCatalog = await provider.loadPropertyCatalog(propertyIds);
      const windowResults = await Promise.all(
        candidateWindows.map(async (window) => ({
          window,
          availability: await provider.searchAvailability({
            propertyIds,
            checkin: window.checkin,
            checkout: window.checkout,
            adults: input.adults,
          }),
        })),
      );

      const offers = rankStayOffers(
        windowResults.flatMap(({ window, availability }) =>
          availability
            .map((property) =>
              buildOfferSummary({
                propertyId: property.propertyId,
                window,
                catalogEntry: propertyCatalog[property.propertyId],
                availability: property,
              }),
            )
            .filter((offer): offer is LodgingOfferSummary => Boolean(offer)),
        ),
        tripDraft.budgetStyle,
      ).slice(0, maxBlendedOffers);

      logger.info("Fetched trip stay availability", {
        tripDraftId,
        destinationId: tripDraft.destinationId,
        candidateWindowCount: candidateWindows.length,
        propertyCount: propertyIds.length,
        offerCount: offers.length,
        metric: buildMetricEvent("bookings.trip_stay_searched", 1, "count"),
      });

      return {
        candidateWindows,
        offers,
      };
    } catch (error) {
      logger.error("Trip stay availability search failed", {
        tripDraftId,
        destinationId: tripDraft.destinationId,
        expediaRegionId: destination.expediaRegionId,
        error,
      });

      throw new BookingServiceError(
        "availability_upstream_failure",
        "Expedia Rapid availability search failed.",
        {
          cause: error,
        },
      );
    }
  },
  async selectTripStay(tripDraftId: string, offer: LodgingOfferSummary): Promise<SelectedStay> {
    const tripDraft = await loadTripWorkspace(tripDraftId);
    if (!tripDraft) {
      throw new BookingServiceError("trip_not_found", `Trip draft ${tripDraftId} was not found.`);
    }

    const selectedStay = await saveSelectedStay({
      tripDraftId,
      offer,
    });

    logger.info("Persisted selected stay", {
      tripDraftId,
      propertyId: offer.propertyId,
      rateId: offer.rateId,
      metric: buildMetricEvent("bookings.trip_stay_selected", 1, "count"),
    });

    return selectedStay;
  },
  async loadSelectedStay(tripDraftId: string) {
    return loadSelectedStay(tripDraftId);
  },
});

export const loadBookingPreview = (tripDraftId: string) =>
  createBookingService().loadSelectedStay(tripDraftId);
