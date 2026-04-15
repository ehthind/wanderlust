import type {
  DestinationProfileDetail,
  DestinationProfileStoryCard,
  DestinationSummary,
} from "@wanderlust/shared-schemas";
import { createLogger } from "@wanderlust/shared-logging";

import { discoverDestinationIds, featuredDestinationId } from "./config";
import type { DestinationProfile } from "./types";

const logger = createLogger("destinations.repo", {
  includeTrace: true,
});

const createDetails = (
  destination: DestinationSummary,
): DestinationProfileDetail[] => [
  { label: "Best season", value: destination.bestSeason },
  { label: "Budget", value: destination.budget },
  { label: "Visa", value: destination.visa },
  { label: "Trip length", value: destination.idealTripLength },
];

const createStory = (
  id: string,
  category: string,
  title: string,
  imageUrl: string,
  imageAccessibilityLabel: string,
): DestinationProfileStoryCard => ({
  id,
  category,
  title,
  imageUrl,
  imageAccessibilityLabel,
});

const discoverDestinationProfiles: DestinationProfile[] = [
  {
    destination: {
      id: discoverDestinationIds[0],
      slug: "paris",
      city: "Paris",
      country: "France",
      thesis: "Go for the late-night glow, layered history, and beauty as part of daily life.",
      bestSeason: "Apr-Oct",
      budget: "$$$",
      visa: "Visa-free",
      idealTripLength: "4-7 days",
      heroImageUrl:
        "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1600&q=80",
      heroImageAccessibilityLabel: "Eiffel Tower and Paris rooftops in the evening light",
    },
    details: createDetails({
      id: discoverDestinationIds[0],
      slug: "paris",
      city: "Paris",
      country: "France",
      thesis: "Go for the late-night glow, layered history, and beauty as part of daily life.",
      bestSeason: "Apr-Oct",
      budget: "$$$",
      visa: "Visa-free",
      idealTripLength: "4-7 days",
      heroImageUrl:
        "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1600&q=80",
      heroImageAccessibilityLabel: "Eiffel Tower and Paris rooftops in the evening light",
    }),
    stories: [
      createStory(
        "paris-story-1",
        "Neighborhood",
        "Walk Saint-Germain before the city fully wakes up.",
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
        "Morning light on a Parisian street near Saint-Germain-des-Pres",
      ),
      createStory(
        "paris-story-2",
        "Dining",
        "Book one long dinner and leave the rest for terraces.",
        "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=1200&q=80",
        "Paris cafe tables set outside along a narrow street",
      ),
      createStory(
        "paris-story-3",
        "Museum",
        "Use one museum as an anchor, not your whole itinerary.",
        "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?auto=format&fit=crop&w=1200&q=80",
        "Interior gallery space in a Paris museum",
      ),
      createStory(
        "paris-story-4",
        "Hotel",
        "Stay Left Bank if you want the trip to feel cinematic fast.",
        "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80",
        "Elegant Paris hotel room with balcony doors",
      ),
      createStory(
        "paris-story-5",
        "Late Night",
        "The river is better after dinner than at noon.",
        "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=1200&q=80",
        "Night view of the Seine with illuminated bridges",
      ),
      createStory(
        "paris-story-6",
        "Style",
        "Pack for cafés, not landmarks, and the city makes more sense.",
        "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1200&q=80",
        "Fashionable pedestrian crossing a Paris street",
      ),
      createStory(
        "paris-story-7",
        "Market",
        "Pick one market morning and let lunch happen there.",
        "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80",
        "Fresh produce and flowers at an outdoor Paris market",
      ),
      createStory(
        "paris-story-8",
        "View",
        "Save the skyline moment for your last afternoon.",
        "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80",
        "Paris skyline with the Eiffel Tower in the distance",
      ),
    ],
  },
  {
    destination: {
      id: discoverDestinationIds[1],
      slug: "kyoto",
      city: "Kyoto",
      country: "Japan",
      thesis: "Go for temple mornings, quiet lanes, and a city that rewards moving slower than your itinerary.",
      bestSeason: "Mar-May",
      budget: "$$-$$$",
      visa: "Visa-free",
      idealTripLength: "4-6 days",
      heroImageUrl:
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
      heroImageAccessibilityLabel: "Kyoto street with lanterns and traditional wooden buildings",
    },
    details: createDetails({
      id: discoverDestinationIds[1],
      slug: "kyoto",
      city: "Kyoto",
      country: "Japan",
      thesis: "Go for temple mornings, quiet lanes, and a city that rewards moving slower than your itinerary.",
      bestSeason: "Mar-May",
      budget: "$$-$$$",
      visa: "Visa-free",
      idealTripLength: "4-6 days",
      heroImageUrl:
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
      heroImageAccessibilityLabel: "Kyoto street with lanterns and traditional wooden buildings",
    }),
    stories: [
      createStory(
        "kyoto-story-1",
        "Temple",
        "Get to Kiyomizu before breakfast and keep the rest of the day light.",
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80",
        "Kyoto temple walkway in soft morning light",
      ),
      createStory(
        "kyoto-story-2",
        "Tea",
        "One proper tea stop changes the pace of the whole trip.",
        "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=1200&q=80",
        "Tea service in a traditional Kyoto room",
      ),
      createStory(
        "kyoto-story-3",
        "Walk",
        "The side streets in Higashiyama are the real itinerary.",
        "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80",
        "Narrow Kyoto lane lined with wooden townhouses",
      ),
      createStory(
        "kyoto-story-4",
        "Stay",
        "A ryokan night earns its price if the rest of the trip stays simple.",
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
        "Traditional Japanese inn room with tatami mats",
      ),
      createStory(
        "kyoto-story-5",
        "Craft",
        "Kyoto shopping is strongest when it feels collected, not exhaustive.",
        "https://images.unsplash.com/photo-1526483360412-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
        "Japanese ceramics and handcrafted tableware on display",
      ),
      createStory(
        "kyoto-story-6",
        "Garden",
        "Trade one crowded highlight for a quieter garden in the afternoon.",
        "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1200&q=80",
        "Peaceful Kyoto garden with stone path and greenery",
      ),
      createStory(
        "kyoto-story-7",
        "Dining",
        "Keep dinner near Gion and let the walk back do the work.",
        "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80",
        "Lantern-lit Kyoto dining street at dusk",
      ),
      createStory(
        "kyoto-story-8",
        "Season",
        "Kyoto feels most persuasive when the weather asks you to linger.",
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
        "Traditional Kyoto street with lanterns and evening light",
      ),
    ],
  },
  {
    destination: {
      id: discoverDestinationIds[2],
      slug: "mexico-city",
      city: "Mexico City",
      country: "Mexico",
      thesis: "Go for design energy, serious food, and neighborhoods that make a long weekend feel much larger.",
      bestSeason: "Oct-Apr",
      budget: "$$",
      visa: "Visa-free",
      idealTripLength: "4-5 days",
      heroImageUrl:
        "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1600&q=80",
      heroImageAccessibilityLabel: "Mexico City skyline at golden hour with mountains in the distance",
    },
    details: createDetails({
      id: discoverDestinationIds[2],
      slug: "mexico-city",
      city: "Mexico City",
      country: "Mexico",
      thesis: "Go for design energy, serious food, and neighborhoods that make a long weekend feel much larger.",
      bestSeason: "Oct-Apr",
      budget: "$$",
      visa: "Visa-free",
      idealTripLength: "4-5 days",
      heroImageUrl:
        "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1600&q=80",
      heroImageAccessibilityLabel: "Mexico City skyline at golden hour with mountains in the distance",
    }),
    stories: [
      createStory(
        "mexico-city-story-1",
        "Neighborhood",
        "Base the trip in Roma or Condesa and let the blocks carry the mood.",
        "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
        "Tree-lined street in Mexico City's Roma neighborhood",
      ),
      createStory(
        "mexico-city-story-2",
        "Dining",
        "Use one reservation for ambition and leave the rest to tacos.",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        "Modern plated meal in a Mexico City restaurant",
      ),
      createStory(
        "mexico-city-story-3",
        "Design",
        "The city feels most itself where concrete, greenery, and color meet.",
        "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80",
        "Modern Mexico City architecture with bold geometric lines",
      ),
      createStory(
        "mexico-city-story-4",
        "Market",
        "Give a market lunch enough time to turn into the afternoon.",
        "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1200&q=80",
        "Busy Mexico City food market with colorful stalls",
      ),
      createStory(
        "mexico-city-story-5",
        "Museum",
        "Pair one museum morning with a park-heavy afternoon.",
        "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1200&q=80",
        "Museum gallery interior with contemporary art",
      ),
      createStory(
        "mexico-city-story-6",
        "Stay",
        "A design hotel works here because you will actually use it between outings.",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
        "Boutique hotel room with warm wood and leather details",
      ),
      createStory(
        "mexico-city-story-7",
        "Night",
        "The city stays generous after dark without forcing the pace.",
        "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
        "Mexico City avenue lit at night with traffic and streetlights",
      ),
      createStory(
        "mexico-city-story-8",
        "Weekend",
        "Four days is enough if you keep the radius tight and the meals long.",
        "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1200&q=80",
        "Mexico City skyline with mountains in the distance",
      ),
    ],
  },
];

const cloneDestinationSummary = (destination: DestinationSummary): DestinationSummary => ({
  ...destination,
});

const cloneDetails = (details: DestinationProfileDetail[]): DestinationProfileDetail[] =>
  details.map((detail) => ({ ...detail }));

const cloneStories = (stories: DestinationProfileStoryCard[]): DestinationProfileStoryCard[] =>
  stories.map((story) => ({ ...story }));

const cloneDestinationProfile = (profile: DestinationProfile): DestinationProfile => ({
  destination: cloneDestinationSummary(profile.destination),
  details: cloneDetails(profile.details),
  stories: cloneStories(profile.stories),
});

export const listDiscoverDestinations = (): DestinationSummary[] => {
  logger.debug("Loading discover destinations", {
    destinationIds: discoverDestinationIds,
  });

  return discoverDestinationProfiles.map((profile) => cloneDestinationSummary(profile.destination));
};

export const getFeaturedDestination = (): DestinationSummary => {
  logger.debug("Loading featured destination", {
    destinationId: featuredDestinationId,
  });

  return cloneDestinationSummary(
    discoverDestinationProfiles.find((profile) => profile.destination.id === featuredDestinationId)
      ?.destination ?? discoverDestinationProfiles[0]!.destination,
  );
};

export const getDestinationProfile = (destinationId: string): DestinationProfile | null => {
  logger.debug("Loading destination profile", {
    destinationId,
  });

  const profile = discoverDestinationProfiles.find(
    (candidate) => candidate.destination.id === destinationId,
  );

  return profile ? cloneDestinationProfile(profile) : null;
};
