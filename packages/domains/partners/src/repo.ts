import { featuredPartnerKind } from "./config";
import type { FeaturedPartner } from "./types";

export const getFeaturedPartner = (): FeaturedPartner => ({
  id: "partner_paris_house",
  kind: featuredPartnerKind,
  displayName: "Paris House",
  payoutReady: false,
});
