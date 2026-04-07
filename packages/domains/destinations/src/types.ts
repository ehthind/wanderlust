import type { DestinationSummary } from "@wanderlust/shared-schemas";

export type DestinationProfile = DestinationSummary & {
  whyGo: string;
  storyCategories: string[];
};
