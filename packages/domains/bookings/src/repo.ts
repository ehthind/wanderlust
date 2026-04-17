import type { LodgingOfferSummary, TripSelectedStay } from "@wanderlust/shared-schemas";
import { createSupabaseAdminRequest } from "@wanderlust/shared-supabase";

import type { DestinationInventorySource } from "./types";

type DestinationRow = {
  id: string;
  city: string;
  country: string;
  expedia_region_id: string | null;
};

type TripSelectedStayRow = {
  trip_draft_id: string;
  provider: "expedia-rapid";
  property_id: string;
  room_id: string;
  rate_id: string;
  window_id: string;
  window_label: string;
  checkin: string;
  checkout: string;
  nights: number;
  property_name: string;
  room_name: string;
  image_url: string | null;
  address_line_1: string | null;
  city: string | null;
  country_code: string | null;
  star_rating: number | null;
  review_score: number | null;
  total_price: string | number;
  nightly_price: string | number | null;
  currency: string;
  cancellation_summary: string;
  current_refundability: TripSelectedStay["currentRefundability"];
  amenities: string[] | null;
  selected_at: string;
};

const mapDestinationInventorySource = (row: DestinationRow): DestinationInventorySource => ({
  destinationId: row.id,
  city: row.city,
  country: row.country,
  expediaRegionId: row.expedia_region_id,
});

const mapSelectedStay = (row: TripSelectedStayRow): TripSelectedStay => ({
  provider: row.provider,
  windowId: row.window_id,
  windowLabel: row.window_label,
  checkin: row.checkin,
  checkout: row.checkout,
  nights: row.nights,
  propertyId: row.property_id,
  roomId: row.room_id,
  rateId: row.rate_id,
  propertyName: row.property_name,
  roomName: row.room_name,
  imageUrl: row.image_url,
  addressLine1: row.address_line_1,
  city: row.city,
  countryCode: row.country_code,
  starRating: row.star_rating,
  reviewScore: row.review_score,
  totalPrice: Number(row.total_price),
  nightlyPrice: row.nightly_price === null ? null : Number(row.nightly_price),
  currency: row.currency,
  cancellationSummary: row.cancellation_summary,
  currentRefundability: row.current_refundability,
  amenities: row.amenities ?? [],
  selectedAt: row.selected_at,
});

export const loadDestinationInventorySource = async (
  destinationId: string,
): Promise<DestinationInventorySource | null> => {
  const rows = (await createSupabaseAdminRequest({
    table: "destinations",
    query: new URLSearchParams({
      select: "id,city,country,expedia_region_id",
      id: `eq.${destinationId}`,
      limit: "1",
    }),
  })) as DestinationRow[];

  const row = rows[0];
  return row ? mapDestinationInventorySource(row) : null;
};

export const loadSelectedStayByTripId = async (
  tripDraftId: string,
): Promise<TripSelectedStay | null> => {
  const rows = (await createSupabaseAdminRequest({
    table: "trip_selected_stays",
    query: new URLSearchParams({
      select:
        "trip_draft_id,provider,property_id,room_id,rate_id,window_id,window_label,checkin,checkout,nights,property_name,room_name,image_url,address_line_1,city,country_code,star_rating,review_score,total_price,nightly_price,currency,cancellation_summary,current_refundability,amenities,selected_at",
      trip_draft_id: `eq.${tripDraftId}`,
      limit: "1",
    }),
  })) as TripSelectedStayRow[];

  const row = rows[0];
  return row ? mapSelectedStay(row) : null;
};

export const upsertSelectedStay = async ({
  tripDraftId,
  offer,
  rawOffer,
}: {
  tripDraftId: string;
  offer: LodgingOfferSummary;
  rawOffer?: unknown;
}): Promise<TripSelectedStay> => {
  const rows = (await createSupabaseAdminRequest({
    table: "trip_selected_stays",
    method: "POST",
    query: new URLSearchParams({
      select:
        "trip_draft_id,provider,property_id,room_id,rate_id,window_id,window_label,checkin,checkout,nights,property_name,room_name,image_url,address_line_1,city,country_code,star_rating,review_score,total_price,nightly_price,currency,cancellation_summary,current_refundability,amenities,selected_at",
      on_conflict: "trip_draft_id",
    }),
    prefer: "resolution=merge-duplicates,return=representation",
    body: {
      trip_draft_id: tripDraftId,
      provider: offer.provider,
      property_id: offer.propertyId,
      room_id: offer.roomId,
      rate_id: offer.rateId,
      window_id: offer.windowId,
      window_label: offer.windowLabel,
      checkin: offer.checkin,
      checkout: offer.checkout,
      nights: offer.nights,
      property_name: offer.propertyName,
      room_name: offer.roomName,
      image_url: offer.imageUrl,
      address_line_1: offer.addressLine1,
      city: offer.city,
      country_code: offer.countryCode,
      star_rating: offer.starRating,
      review_score: offer.reviewScore,
      total_price: offer.totalPrice,
      nightly_price: offer.nightlyPrice,
      currency: offer.currency,
      cancellation_summary: offer.cancellationSummary,
      current_refundability: offer.currentRefundability,
      amenities: offer.amenities,
      offer_snapshot: offer,
      raw_offer: rawOffer ?? offer,
      selected_at: new Date().toISOString(),
    },
  })) as TripSelectedStayRow[];

  const row = rows[0];
  if (!row) {
    throw new Error(`Trip selected stay ${tripDraftId} was not returned from Supabase.`);
  }

  return mapSelectedStay(row);
};
