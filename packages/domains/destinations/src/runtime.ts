import { createLogger } from "@wanderlust/shared-logging";
import { buildMetricEvent } from "@wanderlust/shared-observability";

import { loadDiscoverDestination } from "./service";

const logger = createLogger("destinations.runtime", {
  includeTrace: true,
});

export const getDiscoverCardModel = () => {
  const destination = loadDiscoverDestination();
  const metric = buildMetricEvent("discover.destination.loaded", 1, "count");

  logger.info("Built discover card model", {
    destinationId: destination.id,
    metric,
  });

  return {
    destination,
    cues: {
      primaryAction: "Plan Trip",
      secondaryAction: "Save",
      gestureHint: "Swipe left for the destination profile",
    },
  };
};
