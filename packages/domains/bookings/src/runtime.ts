import { loadBookingPreview } from "./service";

export const getBookingModel = (tripDraftId: string) => loadBookingPreview(tripDraftId);
