import { destinationInfoChips } from "@wanderlust/shared-ui";

import { getDiscoverCardModel } from "./runtime";

export const getDiscoverCardView = () => {
  const model = getDiscoverCardModel();

  return {
    ...model,
    chips: destinationInfoChips(model.destination),
  };
};
