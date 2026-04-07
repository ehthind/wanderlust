import { z } from "zod";

export const destinationSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  city: z.string(),
  country: z.string(),
  thesis: z.string(),
  bestSeason: z.string(),
  budget: z.string(),
  visa: z.string(),
  idealTripLength: z.string(),
});

export const tripDraftSchema = z.object({
  id: z.string(),
  destinationId: z.string(),
  travelerCount: z.number().int().positive(),
  vibe: z.string(),
  budgetStyle: z.enum(["lean", "balanced", "luxury"]),
});

export const travelerIdentitySchema = z.object({
  id: z.string(),
  mode: z.enum(["guest", "account"]),
  email: z.string().email().optional(),
});

export const bookingIntentSchema = z.object({
  id: z.string(),
  destinationId: z.string(),
  status: z.enum(["draft", "priced", "confirmed", "cancelled"]),
});

export const partnerProfileSchema = z.object({
  id: z.string(),
  kind: z.enum(["hostel", "hotel", "guide", "experience"]),
  displayName: z.string(),
  payoutReady: z.boolean(),
});

export const inboxThreadSummarySchema = z.object({
  id: z.string(),
  subject: z.string(),
  kind: z.enum(["concierge", "booking", "recovery"]),
  unreadCount: z.number().int().nonnegative(),
});

export type DestinationSummary = z.infer<typeof destinationSummarySchema>;
export type TripDraft = z.infer<typeof tripDraftSchema>;
export type TravelerIdentity = z.infer<typeof travelerIdentitySchema>;
export type BookingIntent = z.infer<typeof bookingIntentSchema>;
export type PartnerProfile = z.infer<typeof partnerProfileSchema>;
export type InboxThreadSummary = z.infer<typeof inboxThreadSummarySchema>;
