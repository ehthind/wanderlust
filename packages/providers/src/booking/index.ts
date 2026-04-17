import crypto from "node:crypto";

import { type AppEnv, loadAppEnv } from "@wanderlust/shared-config";
import { extractPropertyIds, parseAvailabilityPayload, parsePropertyCatalog } from "./parsing";

type RapidEnv = {
  EXPEDIA_RAPID_API_KEY: string;
  EXPEDIA_RAPID_SHARED_SECRET: string;
  EXPEDIA_RAPID_BASE_URL: string;
};
type RapidEnvInput = {
  EXPEDIA_RAPID_API_KEY?: string | undefined;
  EXPEDIA_RAPID_SHARED_SECRET?: string | undefined;
  EXPEDIA_RAPID_BASE_URL?: string | undefined;
};

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
  listRegionPropertyIds(
    regionId: string,
    options?: { language?: string; limit?: number },
  ): Promise<string[]>;
  loadPropertyCatalog(
    propertyIds: string[],
    options?: { language?: string },
  ): Promise<Record<string, PropertyCatalogEntry>>;
  searchAvailability(input: AvailabilitySearchInput): Promise<AvailabilityProperty[]>;
};

type FetchLike = typeof fetch;
type ProviderOptions = {
  env?: RapidEnvInput;
  fetchImpl?: FetchLike;
  now?: () => number;
};

const defaultRapidLanguage = "en-US";
const defaultRapidCurrency = "USD";
const defaultRapidCountryCode = "US";
const defaultRapidSupplySource = "expedia";
const defaultRapidRatePlanCount = 1;
const defaultRapidUserAgent = "Wanderlust/0.1";

const assertRapidEnv = (env: RapidEnvInput): RapidEnv => {
  if (
    !env.EXPEDIA_RAPID_API_KEY ||
    !env.EXPEDIA_RAPID_SHARED_SECRET ||
    !env.EXPEDIA_RAPID_BASE_URL
  ) {
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

export const createExpediaRapidBookingProvider = ({
  env,
  fetchImpl = fetch,
  now = Date.now,
}: ProviderOptions = {}): BookingProvider => {
  const resolveEnv = async () => {
    if (
      env?.EXPEDIA_RAPID_API_KEY ||
      env?.EXPEDIA_RAPID_SHARED_SECRET ||
      env?.EXPEDIA_RAPID_BASE_URL
    ) {
      return assertRapidEnv(env);
    }

    const loadedEnv = await loadAppEnv();
    return assertRapidEnv({
      EXPEDIA_RAPID_API_KEY: loadedEnv.EXPEDIA_RAPID_API_KEY,
      EXPEDIA_RAPID_SHARED_SECRET: loadedEnv.EXPEDIA_RAPID_SHARED_SECRET,
      EXPEDIA_RAPID_BASE_URL: loadedEnv.EXPEDIA_RAPID_BASE_URL,
    });
  };

  const requestJson = async (path: string, searchParams: URLSearchParams) => {
    const resolvedEnv = await resolveEnv();
    const timestamp = Math.floor(now() / 1000);
    const response = await fetchImpl(
      `${resolvedEnv.EXPEDIA_RAPID_BASE_URL}${path}?${searchParams.toString()}`,
      {
        headers: buildRapidHeaders(resolvedEnv, timestamp),
      },
    );

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

      return parseAvailabilityPayload(
        await requestJson("/v3/properties/availability", searchParams),
        input.adults,
      );
    },
  };
};

export const createBookingProvider = createExpediaRapidBookingProvider;
