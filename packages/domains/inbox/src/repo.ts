import { defaultInboxKind } from "./config";
import type { InboxPreview } from "./types";

export const getInboxPreview = (): InboxPreview => ({
  id: "thread_paris_intro",
  subject: "Your Paris planning thread",
  kind: defaultInboxKind,
  unreadCount: 0,
});
