import type { DestinationSummary } from "@wanderlust/shared-schemas";

export const destinationInfoChips = (destination: DestinationSummary) => [
  { label: "Best season", value: destination.bestSeason },
  { label: "Budget", value: destination.budget },
  { label: "Visa", value: destination.visa },
  { label: "Trip length", value: destination.idealTripLength },
];
