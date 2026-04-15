import { getBookingModel } from "./runtime";

export const getBookingView = (tripDraftId: string) => getBookingModel(tripDraftId);
