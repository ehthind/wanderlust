import { guestTravelerMode } from "./config";
import type { TravelerProfile } from "./types";

export const getGuestTraveler = (): TravelerProfile => ({
  id: "traveler_guest",
  mode: guestTravelerMode,
});
