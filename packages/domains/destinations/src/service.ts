import { createLogger } from "@wanderlust/shared-logging";

import { getDestinationProfile, getFeaturedDestination, listDiscoverDestinations } from "./repo";

const logger = createLogger("destinations.service", {
  includeTrace: true,
});

export const loadDiscoverDestinations = () => {
  logger.info("Loading discover destinations");
  return listDiscoverDestinations();
};

export const loadDiscoverDestination = () => {
  logger.info("Loading discover destination");
  return getFeaturedDestination();
};

export const loadDestinationProfile = (destinationId: string) => {
  logger.info("Loading destination profile", {
    destinationId,
  });

  return getDestinationProfile(destinationId);
};
