import { defaultTripBudgetStyle } from "./config";
import type { TripWorkspace } from "./types";

export const createDraftTripWorkspace = (): TripWorkspace => ({
  id: "trip_paris_draft",
  destinationId: "dest_paris",
  travelerCount: 2,
  vibe: "romantic",
  budgetStyle: defaultTripBudgetStyle,
  status: "draft",
});
