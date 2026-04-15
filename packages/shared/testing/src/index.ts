import type { DestinationSummary } from "@wanderlust/shared-schemas";

export const parisSummaryFixture = (): DestinationSummary => ({
  id: "dest_paris",
  slug: "paris",
  city: "Paris",
  country: "France",
  thesis: "Go for the late-night glow, layered history, and beauty as part of daily life.",
  bestSeason: "Apr-Jun",
  budget: "$$$",
  visa: "Usually not required",
  idealTripLength: "5-7 days",
  heroImageUrl:
    "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=1600&q=80",
  heroImageAccessibilityLabel: "Eiffel Tower and Paris rooftops at dusk",
});
