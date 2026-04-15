import crypto from "node:crypto";

import { type AppEnv, loadAppEnv } from "@wanderlust/shared-config";

type RapidEnv = Pick<
  AppEnv,
  "EXPEDIA_RAPID_API_KEY" | "EXPEDIA_RAPID_SHARED_SECRET" | "EXPEDIA_RAPID_BASE_URL"
>;

export type PropertyCatalogEntry = {
  propertyId: string;
  propertyName: string;
  imageUrl: string | null;
  addressLine1: string | null;
  city: string | null;
  countryCode: string | null;
  starRating: number | null;
  reviewScore: number | null;
  amenities: string[];
};

export type AvailabilitySearchInput = {
  propertyIds: string[];
  checkin: string;
  checkout: string;
  adults: number;
  language?: string;
  currency?: string;
  countryCode?: string;
};

export type AvailabilityOffer = {
  roomId: string;
  rateId: string;
  roomName: string;
  totalPrice: number;
  nightlyPrice: number | null;
  currency: string;
  cancellationSummary: string;
  currentRefundability: "refundable" | "partially_refundable" | "non_refundable" | "unknown";
  propertyScore: number | null;
  rawOffer: unknown;
};

export type AvailabilityProperty = {
  propertyId: string;
  offers: AvailabilityOffer[];
};

export type BookingProvider = {
  listRegionPropertyIds(regionId: string, options?: { language?: string; limit?: number }): Promise<string[]>;
  loadPropertyCatalog(
    propertyIds: string[],
    options?: { language?: string },
  ): Promise<Record<string, PropertyCatalogEntry>>;
  searchAvailability(input: AvailabilitySearchInput): Promise<AvailabilityProperty[]>;
};

type FetchLike = typeof fetch;
type ProviderOptions = {
  env?: Partial<RapidEnv>;
  fetchImpl?: FetchLike;
  now?: () => number;
};

const defaultRapidLanguage = "en-US";
const defaultRapidCurrency = "USD";
const defaultRapidCountryCode = "US";
const defaultRapidSupplySource = "expedia";
const defaultRapidRatePlanCount = 1;
const defaultRapidUserAgent = "Wanderlust/0.1";

const assertRapidEnv = (env: Partial<RapidEnv>): RapidEnv => {
  if (!env.EXPEDIA_RAPID_API_KEY || !env.EXPEDIA_RAPID_SHARED_SECRET || !env.EXPEDIA_RAPID_BASE_URL) {
    throw new Error(
      "Set EXPEDIA_RAPID_API_KEY, EXPEDIA_RAPID_SHARED_SECRET, and EXPEDIA_RAPID_BASE_URL before using Expedia Rapid availability.",
    );
  }

  return {
    EXPEDIA_RAPID_API_KEY: env.EXPEDIA_RAPID_API_KEY,
    EXPEDIA_RAPID_SHARED_SECRET: env.EXPEDIA_RAPID_SHARED_SECRET,
    EXPEDIA_RAPID_BASE_URL: env.EXPEDIA_RAPID_BASE_URL.replace(/\/+$/, ""),
  };
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

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

const asString = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value : null);

const pushParam = (searchParams: URLSearchParams, key: string, value: string | string[]) => {
  if (Array.isArray(value)) {
    for (const item of value) {
      searchParams.append(key, item);
    }
    return;
  }

  searchParams.append(key, value);
};

export const buildExpediaRapidAuthorizationHeader = ({
  apiKey,
  sharedSecret,
  timestamp,
}: {
  apiKey: string;
  sharedSecret: string;
  timestamp: number;
}) => {
  const signature = crypto
    .createHash("sha512")
    .update(`${apiKey}${sharedSecret}${timestamp}`)
    .digest("hex");

  return `EAN APIKey=${apiKey},Signature=${signature},timestamp=${timestamp}`;
};

const buildRapidHeaders = (env: RapidEnv, timestamp: number) => ({
  Accept: "application/json",
  "Accept-Encoding": "gzip",
  Authorization: buildExpediaRapidAuthorizationHeader({
    apiKey: env.EXPEDIA_RAPID_API_KEY,
    sharedSecret: env.EXPEDIA_RAPID_SHARED_SECRET,
    timestamp,
  }),
  "User-Agent": defaultRapidUserAgent,
});

const extractPropertyIds = (payload: unknown) => {
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

const parsePropertyCatalog = (payload: unknown): Record<string, PropertyCatalogEntry> => {
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
              asNumber(ratings?.property?.rating) ??
              asNumber(ratings?.property?.value) ??
              asNumber(entry.star_rating),
            reviewScore:
              asNumber(ratings?.guest?.overall) ??
              asNumber(ratings?.guest?.value) ??
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

const parseAvailabilityPayload = (payload: unknown, adults: number): AvailabilityProperty[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((property) => asRecord(property))
    .filter((property): property is Record<string, unknown> => Boolean(property))
    .map((property) => {
      const propertyId = asString(property.property_id);
      if (!propertyId) {
        return null;
      }

      const offers =
        (Array.isArray(property.rooms) ? property.rooms : [])
          .map((room) => asRecord(room))
          .filter((room): room is Record<string, unknown> => Boolean(room))
          .flatMap((room) => {
            const roomName = asString(room.room_name) ?? "Room";

            return (Array.isArray(room.rates) ? room.rates : [])
              .map((rate) => asRecord(rate))
              .filter((rate): rate is Record<string, unknown> => Boolean(rate))
              .map((rate) => {
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
              .filter((offer): offer is AvailabilityOffer => Boolean(offer));
          })
          .sort((left, right) => left.totalPrice - right.totalPrice) ?? [];

      return {
        propertyId,
        offers,
      } satisfies AvailabilityProperty;
    })
    .filter((property): property is AvailabilityProperty => Boolean(property) && property.offers.length > 0);
};

export const createExpediaRapidBookingProvider = ({
  env,
  fetchImpl = fetch,
  now = Date.now,
}: ProviderOptions = {}): BookingProvider => {
  const resolveEnv = async () => {
    if (env?.EXPEDIA_RAPID_API_KEY || env?.EXPEDIA_RAPID_SHARED_SECRET || env?.EXPEDIA_RAPID_BASE_URL) {
      return assertRapidEnv(env);
    }

    return assertRapidEnv(await loadAppEnv());
  };

  const requestJson = async (path: string, searchParams: URLSearchParams) => {
    const resolvedEnv = await resolveEnv();
    const timestamp = Math.floor(now() / 1000);
    const response = await fetchImpl(`${resolvedEnv.EXPEDIA_RAPID_BASE_URL}${path}?${searchParams.toString()}`, {
      headers: buildRapidHeaders(resolvedEnv, timestamp),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Expedia Rapid request failed: ${response.status} ${detail}`.trim());
    }

    return (await response.json()) as unknown;
  };

  return {
    async listRegionPropertyIds(regionId, options = {}) {
      const searchParams = new URLSearchParams({
        language: options.language ?? defaultRapidLanguage,
        supply_source: defaultRapidSupplySource,
      });
      pushParam(searchParams, "include", ["property_ids", "property_ids_expanded"]);

      const payload = await requestJson(`/v3/regions/${regionId}`, searchParams);
      const propertyIds = Array.from(new Set(extractPropertyIds(payload)));
      return propertyIds.slice(0, options.limit ?? propertyIds.length);
    },
    async loadPropertyCatalog(propertyIds, options = {}) {
      if (propertyIds.length === 0) {
        return {};
      }

      const searchParams = new URLSearchParams({
        language: options.language ?? defaultRapidLanguage,
        supply_source: defaultRapidSupplySource,
      });
      pushParam(searchParams, "include", ["name", "address", "images", "ratings", "amenities"]);
      pushParam(searchParams, "property_id", propertyIds);

      return parsePropertyCatalog(await requestJson("/v3/properties/content", searchParams));
    },
    async searchAvailability(input) {
      if (input.propertyIds.length === 0) {
        return [];
      }

      const searchParams = new URLSearchParams({
        checkin: input.checkin,
        checkout: input.checkout,
        currency: input.currency ?? defaultRapidCurrency,
        country_code: input.countryCode ?? defaultRapidCountryCode,
        language: input.language ?? defaultRapidLanguage,
        occupancy: String(input.adults),
        rate_plan_count: String(defaultRapidRatePlanCount),
        sales_channel: "mobile_app",
        sales_environment: "hotel_only",
        travel_purpose: "leisure",
      });
      pushParam(searchParams, "include", "rooms.rates.current_refundability");
      pushParam(searchParams, "property_id", input.propertyIds);

      return parseAvailabilityPayload(await requestJson("/v3/properties/availability", searchParams), input.adults);
    },
  };
};

export const createBookingProvider = createExpediaRapidBookingProvider;
