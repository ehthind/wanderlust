import { destinationInfoChips } from "@wanderlust/shared-ui";

import { getDestinationProfileModel, getDiscoverCardModel, getDiscoverFeedModel } from "./runtime";

export const getDiscoverFeedView = () => {
  const model = getDiscoverFeedModel();

  return {
    cards: model.cards.map((card) => ({
      ...card,
      chips: destinationInfoChips(card.destination),
    })),
  };
};

export const getDiscoverCardView = () => {
  const feedCard = getDiscoverFeedView().cards[0];
  if (feedCard) {
    return feedCard;
  }

  const model = getDiscoverCardModel();
  return {
    ...model,
    chips: destinationInfoChips(model.destination),
  };
};

export const getDestinationProfileView = (destinationId: string) => {
  const model = getDestinationProfileModel(destinationId);

  if (!model) {
    return null;
  }

  return {
    destination: model.destination,
    details: model.details,
    stories: model.stories,
    mapTour: model.mapTour,
  };
};
