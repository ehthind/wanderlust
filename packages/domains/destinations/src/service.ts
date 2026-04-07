import { createLogger } from "@wanderlust/shared-logging";

import { getFeaturedDestination } from "./repo";

const logger = createLogger("destinations.service", {
  includeTrace: true,
});

export const loadDiscoverDestination = () => {
  logger.info("Loading discover destination");
  return getFeaturedDestination();
};
