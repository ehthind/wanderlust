import { z } from "zod";

export const tripDraftStatusSchema = z.enum(["draft", "planning", "ready", "failed"]);
export const tripWorkflowStatusSchema = z.enum(["not_started", "running", "completed", "failed"]);
export const tripBudgetStyleSchema = z.enum(["lean", "balanced", "luxury"]);

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
  budgetStyle: tripBudgetStyleSchema,
  status: tripDraftStatusSchema,
  workflowId: z.string().nullable(),
  workflowRunId: z.string().nullable(),
  workflowStatus: tripWorkflowStatusSchema,
  planSummary: z.string().nullable(),
});

export const planTripInputSchema = z.object({
  destinationId: z.string(),
  travelerCount: z.number().int().positive().default(2),
  vibe: z.string().min(1).default("romantic"),
  budgetStyle: tripBudgetStyleSchema.default("balanced"),
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
export type PlanTripInput = z.infer<typeof planTripInputSchema>;
export type TravelerIdentity = z.infer<typeof travelerIdentitySchema>;
export type BookingIntent = z.infer<typeof bookingIntentSchema>;
export type PartnerProfile = z.infer<typeof partnerProfileSchema>;
export type InboxThreadSummary = z.infer<typeof inboxThreadSummarySchema>;
