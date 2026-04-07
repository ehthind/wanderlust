import type { TripDraft } from "@wanderlust/shared-schemas";

export type TripWorkspace = TripDraft & {
  status: "draft";
};
