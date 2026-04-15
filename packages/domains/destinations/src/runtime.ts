import { createLogger } from "@wanderlust/shared-logging";
import { buildMetricEvent } from "@wanderlust/shared-observability";

import { loadDestinationProfile, loadDiscoverDestination, loadDiscoverDestinations } from "./service";

const logger = createLogger("destinations.runtime", {
  includeTrace: true,
});

const buildDiscoverCues = () => ({
  primaryAction: "Plan Trip",
  secondaryAction: "Save",
  gestureHint: "Swipe for next destination",
});

export const getDiscoverFeedModel = () => {
  const destinations = loadDiscoverDestinations();
  const metric = buildMetricEvent("discover.destination.loaded", destinations.length, "count");

  logger.info("Built discover feed model", {
    destinationIds: destinations.map((destination) => destination.id),
    destinationCount: destinations.length,
    metric,
  });

  return {
    cards: destinations.map((destination) => ({
      destination,
      cues: buildDiscoverCues(),
    })),
  };
};

export const getDiscoverCardModel = () => {
  const card = getDiscoverFeedModel().cards[0] ?? {
    destination: loadDiscoverDestination(),
    cues: buildDiscoverCues(),
  };

  return card;
};

export const getDestinationProfileModel = (destinationId: string) => {
  const profile = loadDestinationProfile(destinationId);

  if (!profile) {
    logger.warn("Destination profile was not found", {
      destinationId,
    });

    return null;
  }

  const metric = buildMetricEvent("discover.destination.profile.loaded", 1, "count");

  logger.info("Built destination profile model", {
    destinationId,
    storyCount: profile.stories.length,
    detailCount: profile.details.length,
    metric,
  });

  return profile;
};
