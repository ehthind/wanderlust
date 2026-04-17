import { describe, expect, it, vi } from "vitest";

import type { BookingProvider } from "@wanderlust/providers/booking";
import type { LodgingOfferSummary, TripDraft } from "@wanderlust/shared-schemas";

import {
  type BookingServiceError,
  buildCandidateDateWindows,
  createBookingService,
  rankStayOffers,
} from "./src/service";

const buildTripDraft = (overrides: Partial<TripDraft> = {}): TripDraft => ({
  id: "trip_123",
  destinationId: "dest_paris",
  travelerCount: 2,
  vibe: "romantic",
  budgetStyle: "balanced",
  status: "planning",
  workflowId: "wf_123",
  workflowRunId: "run_123",
  workflowStatus: "running",
  planSummary: null,
  travelMonth: null,
  tripNights: null,
  adults: null,
  ...overrides,
});

const buildOffer = (overrides: Partial<LodgingOfferSummary> = {}): LodgingOfferSummary => ({
  provider: "expedia-rapid",
  windowId: "2026-05-02_2026-05-05",
  windowLabel: "Fri, May 2 - Mon, May 5",
  checkin: "2026-05-02",
  checkout: "2026-05-05",
  nights: 3,
  propertyId: "1",
  roomId: "room_1",
  rateId: "rate_1",
  propertyName: "Property",
  roomName: "King Room",
  imageUrl: "https://example.test/property.jpg",
  addressLine1: "123 Rue Example",
  city: "Paris",
  countryCode: "FR",
  starRating: 4,
  reviewScore: 8.6,
  totalPrice: 220,
  nightlyPrice: 73.33,
  currency: "USD",
  cancellationSummary: "Free cancellation",
  currentRefundability: "refundable",
  amenities: ["Wi-Fi"],
  ...overrides,
});

describe("bookings service", () => {
  it("builds deterministic weekend-biased candidate windows", () => {
    expect(buildCandidateDateWindows("2026-02", 3)).toEqual([
      expect.objectContaining({
        checkin: "2026-02-06",
        checkout: "2026-02-09",
      }),
      expect.objectContaining({
        checkin: "2026-02-13",
        checkout: "2026-02-16",
      }),
      expect.objectContaining({
        checkin: "2026-02-20",
        checkout: "2026-02-23",
      }),
      expect.objectContaining({
        checkin: "2026-02-05",
        checkout: "2026-02-08",
      }),
    ]);
  });

  it("biases ranking toward price for lean, value for balanced, and quality for luxury", () => {
    const cheap = buildOffer({
      propertyId: "cheap",
      totalPrice: 100,
      starRating: 3,
      reviewScore: 7,
      currentRefundability: "non_refundable",
    });
    const value = buildOffer({
      propertyId: "value",
      totalPrice: 130,
      starRating: 4,
      reviewScore: 9,
      currentRefundability: "partially_refundable",
    });
    const luxury = buildOffer({
      propertyId: "luxury",
      totalPrice: 220,
      starRating: 5,
      reviewScore: 9.6,
      currentRefundability: "refundable",
    });

    expect(rankStayOffers([cheap, value, luxury], "lean")[0]?.propertyId).toBe("cheap");
    expect(rankStayOffers([cheap, value, luxury], "balanced")[0]?.propertyId).toBe("value");
    expect(rankStayOffers([cheap, value, luxury], "luxury")[0]?.propertyId).toBe("luxury");
  });

  it("persists trip stay preferences and returns ranked blended offers", async () => {
    const provider: BookingProvider = {
      listRegionPropertyIds: vi.fn().mockResolvedValue(["property_1", "property_2"]),
      loadPropertyCatalog: vi.fn().mockResolvedValue({
        property_1: {
          propertyId: "property_1",
          propertyName: "Hotel M",
          imageUrl: "https://example.test/hotel-m.jpg",
          addressLine1: "1 Left Bank",
          city: "Paris",
          countryCode: "FR",
          starRating: 4,
          reviewScore: 8.4,
          amenities: ["Breakfast"],
        },
        property_2: {
          propertyId: "property_2",
          propertyName: "Maison Rive",
          imageUrl: "https://example.test/maison.jpg",
          addressLine1: "2 Saint Germain",
          city: "Paris",
          countryCode: "FR",
          starRating: 5,
          reviewScore: 9.3,
          amenities: ["Spa"],
        },
      }),
      searchAvailability: vi.fn().mockResolvedValue([
        {
          propertyId: "property_1",
          offers: [
            {
              roomId: "room_1",
              rateId: "rate_1",
              roomName: "Cosy Room",
              totalPrice: 240,
              nightlyPrice: 80,
              currency: "USD",
              cancellationSummary: "Non-refundable",
              currentRefundability: "non_refundable",
              propertyScore: null,
              rawOffer: {},
            },
          ],
        },
        {
          propertyId: "property_2",
          offers: [
            {
              roomId: "room_2",
              rateId: "rate_2",
              roomName: "River Suite",
              totalPrice: 230,
              nightlyPrice: 76.67,
              currency: "USD",
              cancellationSummary: "Partially refundable",
              currentRefundability: "partially_refundable",
              propertyScore: null,
              rawOffer: {},
            },
          ],
        },
      ]),
    };
    const updateTrip = vi.fn().mockResolvedValue(buildTripDraft());
    const service = createBookingService({
      provider,
      loadTripWorkspace: vi.fn().mockResolvedValue(buildTripDraft()),
      updateTrip,
      loadDestinationSource: vi.fn().mockResolvedValue({
        destinationId: "dest_paris",
        city: "Paris",
        country: "France",
        expediaRegionId: "179898",
      }),
      loadSelectedStay: vi.fn(),
      saveSelectedStay: vi.fn(),
    });

    const result = await service.searchTripStays("trip_123", {
      travelMonth: "2026-05",
      tripNights: 3,
      adults: 2,
    });

    expect(updateTrip).toHaveBeenCalledWith("trip_123", {
      travelMonth: "2026-05",
      tripNights: 3,
      adults: 2,
    });
    expect(provider.listRegionPropertyIds).toHaveBeenCalledWith("179898", {
      limit: 100,
    });
    expect(result.candidateWindows).toHaveLength(4);
    expect(result.offers[0]?.propertyId).toBe("property_2");
    expect(result.offers[0]?.windowId).toBe(result.candidateWindows[0]?.id);
  });

  it("maps upstream provider failures to a domain error", async () => {
    const service = createBookingService({
      provider: {
        listRegionPropertyIds: vi.fn().mockRejectedValue(new Error("boom")),
        loadPropertyCatalog: vi.fn(),
        searchAvailability: vi.fn(),
      } as unknown as BookingProvider,
      loadTripWorkspace: vi.fn().mockResolvedValue(buildTripDraft()),
      updateTrip: vi.fn().mockResolvedValue(buildTripDraft()),
      loadDestinationSource: vi.fn().mockResolvedValue({
        destinationId: "dest_paris",
        city: "Paris",
        country: "France",
        expediaRegionId: "179898",
      }),
      loadSelectedStay: vi.fn(),
      saveSelectedStay: vi.fn(),
    });

    await expect(
      service.searchTripStays("trip_123", {
        travelMonth: "2026-05",
        tripNights: 3,
        adults: 2,
      }),
    ).rejects.toMatchObject<Partial<BookingServiceError>>({
      code: "availability_upstream_failure",
    });
  });

  it("persists the selected stay", async () => {
    const offer = buildOffer();
    const saveSelectedStay = vi.fn().mockResolvedValue({
      ...offer,
      selectedAt: "2026-04-15T00:00:00.000Z",
    });
    const service = createBookingService({
      provider: {} as BookingProvider,
      loadTripWorkspace: vi.fn().mockResolvedValue(buildTripDraft()),
      updateTrip: vi.fn(),
      loadDestinationSource: vi.fn(),
      loadSelectedStay: vi.fn(),
      saveSelectedStay,
    });

    await expect(service.selectTripStay("trip_123", offer)).resolves.toMatchObject({
      propertyId: "1",
      selectedAt: "2026-04-15T00:00:00.000Z",
    });
    expect(saveSelectedStay).toHaveBeenCalledWith({
      tripDraftId: "trip_123",
      offer,
    });
  });
});
