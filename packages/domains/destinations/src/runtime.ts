import { loadDiscoverDestination } from "./service";

export const getDiscoverCardModel = () => {
  const destination = loadDiscoverDestination();

  return {
    destination,
    cues: {
      primaryAction: "Plan Trip",
      secondaryAction: "Save",
      gestureHint: "Swipe left for the destination profile",
    },
  };
};
