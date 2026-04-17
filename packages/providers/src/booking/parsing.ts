import type { AvailabilityOffer, AvailabilityProperty, PropertyCatalogEntry } from "./index";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

const isPresent = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const extractPropertyIds = (payload: unknown) => {
  const region = asRecord(payload);
  if (!region) {
    return [];
  }

  const expanded = region.property_ids_expanded;
  if (Array.isArray(expanded)) {
    return expanded
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return asRecord(item)?.property_id;
      })
      .map(asString)
      .filter((value): value is string => Boolean(value));
  }

  const direct = region.property_ids;
  if (Array.isArray(direct)) {
    return direct.map(asString).filter((value): value is string => Boolean(value));
  }

  return [];
};

const pickMoney = (value: unknown): { amount: number; currency: string } | null => {
  const money = asRecord(value);
  if (!money) {
    return null;
  }

  const billable = asRecord(money.billable_currency);
  const requestCurrency = asRecord(money.request_currency);
  const candidate = billable ?? requestCurrency ?? money;
  const amount = asNumber(candidate.value);
  const currency = asString(candidate.currency);

  if (amount === null || !currency) {
    return null;
  }

  return {
    amount,
    currency,
  };
};

const pickPropertyImage = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    for (const image of value) {
      const candidate = pickPropertyImage(image);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const directUrl = asString(record.href) ?? asString(record.url);
  if (directUrl) {
    return directUrl;
  }

  const links = asRecord(record.links);
  if (links) {
    for (const linkValue of Object.values(links)) {
      const candidate = pickPropertyImage(linkValue);
      if (candidate) {
        return candidate;
      }
    }
  }

  for (const nestedValue of Object.values(record)) {
    const candidate = pickPropertyImage(nestedValue);
    if (candidate) {
      return candidate;
    }
  }

  return null;
};

const parseAmenityNames = (value: unknown) => {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  return Object.values(record)
    .map((entry) => asRecord(entry))
    .map((entry) => asString(entry?.name))
    .filter((entry): entry is string => Boolean(entry));
};

export const parsePropertyCatalog = (payload: unknown): Record<string, PropertyCatalogEntry> => {
  const catalog = asRecord(payload);
  if (!catalog) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(catalog).flatMap(([propertyId, rawEntry]) => {
      const entry = asRecord(rawEntry);
      if (!entry) {
        return [];
      }

      const address = asRecord(entry.address);
      const ratings = asRecord(entry.ratings);
      const propertyRatings = asRecord(ratings?.property);
      const guestRatings = asRecord(ratings?.guest);

      return [
        [
          propertyId,
          {
            propertyId,
            propertyName: asString(entry.name) ?? `Property ${propertyId}`,
            imageUrl: pickPropertyImage(entry.images),
            addressLine1: asString(address?.line_1) ?? asString(address?.line1) ?? null,
            city: asString(address?.city) ?? null,
            countryCode: asString(address?.country_code) ?? null,
            starRating:
              asNumber(propertyRatings?.rating) ??
              asNumber(propertyRatings?.value) ??
              asNumber(entry.star_rating),
            reviewScore:
              asNumber(guestRatings?.overall) ??
              asNumber(guestRatings?.value) ??
              asNumber(entry.review_score),
            amenities: parseAmenityNames(entry.amenities),
          } satisfies PropertyCatalogEntry,
        ],
      ];
    }),
  );
};

const mapRefundability = (rate: Record<string, unknown>) => {
  const currentRefundability = asString(rate.current_refundability);
  switch (currentRefundability) {
    case "refundable":
    case "partially_refundable":
    case "non_refundable":
      return currentRefundability;
    default:
      return rate.refundable === true ? "refundable" : "unknown";
  }
};

const buildCancellationSummary = (rate: Record<string, unknown>) => {
  const refundability = mapRefundability(rate);
  const penalties = Array.isArray(rate.cancel_penalties) ? rate.cancel_penalties : [];
  const firstPenalty = penalties[0];
  const start = asString(asRecord(firstPenalty)?.start);

  switch (refundability) {
    case "refundable":
      return start ? `Free cancellation until ${start}` : "Free cancellation";
    case "partially_refundable":
      return start ? `Partially refundable until ${start}` : "Partially refundable";
    case "non_refundable":
      return "Non-refundable";
    default:
      return "Cancellation policy available during checkout";
  }
};

const pickPricingRecord = (rate: Record<string, unknown>, adults: number) => {
  const occupancyPricing = asRecord(rate.occupancy_pricing);
  if (occupancyPricing) {
    const direct = asRecord(occupancyPricing[String(adults)]);
    if (direct) {
      return direct;
    }

    const firstMatch = Object.values(occupancyPricing).map(asRecord).find(Boolean);
    if (firstMatch) {
      return firstMatch;
    }
  }

  return asRecord(rate.pricing);
};

export const parseAvailabilityPayload = (
  payload: unknown,
  adults: number,
): AvailabilityProperty[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((property) => asRecord(property))
    .filter(isPresent)
    .map((property): AvailabilityProperty | null => {
      const propertyId = asString(property.property_id);
      if (!propertyId) {
        return null;
      }

      const offers: AvailabilityOffer[] = (Array.isArray(property.rooms) ? property.rooms : [])
        .map((room) => asRecord(room))
        .filter(isPresent)
        .flatMap((room) => {
          const roomName = asString(room.room_name) ?? "Room";

          return (Array.isArray(room.rates) ? room.rates : [])
            .map((rate) => asRecord(rate))
            .filter(isPresent)
            .map((rate): AvailabilityOffer | null => {
              const pricing = pickPricingRecord(rate, adults);
              const totals = asRecord(pricing?.totals);
              const inclusive =
                pickMoney(totals?.inclusive) ??
                pickMoney(totals?.exclusive) ??
                pickMoney(asRecord(pricing?.stay)?.totals);

              if (!inclusive) {
                return null;
              }

              const nightlyEntry = Array.isArray(pricing?.nightly)
                ? pricing?.nightly.map(asRecord).find(Boolean)
                : null;
              const nightly =
                pickMoney(nightlyEntry?.inclusive) ??
                pickMoney(nightlyEntry?.exclusive) ??
                pickMoney(nightlyEntry);

              const roomId = asString(room.id);
              const rateId = asString(rate.id);

              if (!roomId || !rateId) {
                return null;
              }

              return {
                roomId,
                rateId,
                roomName,
                totalPrice: inclusive.amount,
                nightlyPrice: nightly?.amount ?? null,
                currency: inclusive.currency,
                cancellationSummary: buildCancellationSummary(rate),
                currentRefundability: mapRefundability(rate),
                propertyScore: asNumber(property.score),
                rawOffer: {
                  property,
                  room,
                  rate,
                },
              } satisfies AvailabilityOffer;
            })
            .filter(isPresent);
        })
        .sort((left, right) => left.totalPrice - right.totalPrice);

      return {
        propertyId,
        offers,
      } satisfies AvailabilityProperty;
    })
    .filter(
      (property): property is AvailabilityProperty =>
        isPresent(property) && property.offers.length > 0,
    );
};
