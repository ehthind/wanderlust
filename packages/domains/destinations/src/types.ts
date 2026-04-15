import type {
  DestinationProfileDetail,
  DestinationProfileStoryCard,
  DestinationSummary,
} from "@wanderlust/shared-schemas";

export type DestinationProfile = {
  destination: DestinationSummary;
  details: DestinationProfileDetail[];
  stories: DestinationProfileStoryCard[];
};
