import type {
  CandidateDateWindow,
  LodgingOfferSummary,
  TripSelectedStay,
  TripStaySearchInput,
  TripStaySearchResult,
} from "@wanderlust/shared-schemas";

export type StaySearchInput = TripStaySearchInput;
export type StaySearchResult = TripStaySearchResult;
export type StayDateWindow = CandidateDateWindow;
export type StayOffer = LodgingOfferSummary;
export type SelectedStay = TripSelectedStay;

export type DestinationInventorySource = {
  destinationId: string;
  city: string;
  country: string;
  expediaRegionId: string | null;
};
