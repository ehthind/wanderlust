import { featuredDestinationId } from "./config";
import type { DestinationProfile } from "./types";

export const getFeaturedDestination = (): DestinationProfile => ({
  id: featuredDestinationId,
  slug: "paris",
  city: "Paris",
  country: "France",
  thesis: "Go for the late-night glow, layered history, and beauty as part of daily life.",
  bestSeason: "Apr-Jun",
  budget: "$$$",
  visa: "Usually not required",
  idealTripLength: "5-7 days",
  whyGo:
    "Paris makes romance feel practical: neighborhood cafés, river light, dense culture, and beauty you do not have to schedule.",
  storyCategories: ["Food", "Culture", "Neighborhoods", "Vibe"],
});
