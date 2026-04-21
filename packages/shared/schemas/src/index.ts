import { z } from "zod";

export const tripDraftStatusSchema = z.enum(["draft", "planning", "ready", "failed"]);
export const tripWorkflowStatusSchema = z.enum(["not_started", "running", "completed", "failed"]);
export const tripBudgetStyleSchema = z.enum(["lean", "balanced", "luxury"]);
export const monthStringSchema = z.string().regex(/^\d{4}-\d{2}$/);
export const isoDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const tripExecutionStatusSchema = z.enum(["running", "completed", "failed", "unknown"]);

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
  heroImageUrl: z.string().url(),
  heroImageAccessibilityLabel: z.string(),
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
  travelMonth: monthStringSchema.nullable(),
  tripNights: z.number().int().positive().nullable(),
  adults: z.number().int().positive().nullable(),
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

export const featuredDiscoverChipSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const featuredDiscoverCardSchema = z.object({
  destination: destinationSummarySchema,
  chips: z.array(featuredDiscoverChipSchema),
  cues: z.object({
    primaryAction: z.string(),
    secondaryAction: z.string(),
    gestureHint: z.string(),
  }),
});

export const discoverFeedViewSchema = z.object({
  cards: z.array(featuredDiscoverCardSchema).min(1),
});

export const destinationProfileDetailSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const destinationMapCoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const destinationMapCameraKeyframeSchema = z.object({
  centerCoordinate: destinationMapCoordinateSchema,
  distanceMeters: z.number().positive(),
  pitchDegrees: z.number().min(0).max(90),
  headingDegrees: z.number(),
  durationSeconds: z.number().positive(),
});

export const destinationMapTourStopSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  coordinate: destinationMapCoordinateSchema,
  lookAroundCoordinate: destinationMapCoordinateSchema.optional(),
  keyframes: z.array(destinationMapCameraKeyframeSchema).min(3).max(5),
});

export const destinationMapTourViewSchema = z.object({
  title: z.string(),
  summary: z.string(),
  autoplay: z.boolean(),
  stops: z.array(destinationMapTourStopSchema).length(3),
});

export const destinationProfileStoryCardSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  imageUrl: z.string().url(),
  imageAccessibilityLabel: z.string(),
});

export const destinationProfileViewSchema = z.object({
  destination: destinationSummarySchema,
  details: z.array(destinationProfileDetailSchema).length(4),
  stories: z.array(destinationProfileStoryCardSchema).length(8),
  mapTour: destinationMapTourViewSchema.optional(),
});

export const tripExecutionSchema = z.object({
  workflowId: z.string(),
  runId: z.string().nullable(),
  status: tripExecutionStatusSchema,
});

export const tripStaySearchInputSchema = z.object({
  travelMonth: monthStringSchema,
  tripNights: z.number().int().min(1).max(14),
  adults: z.number().int().min(1).max(6),
});

export const tripStaySearchPreferencesSchema = z.object({
  travelMonth: monthStringSchema.nullable(),
  tripNights: z.number().int().positive().nullable(),
  adults: z.number().int().positive().nullable(),
});

export const candidateDateWindowSchema = z.object({
  id: z.string(),
  label: z.string(),
  checkin: isoDateStringSchema,
  checkout: isoDateStringSchema,
  nights: z.number().int().positive(),
});

export const currentRefundabilitySchema = z.enum([
  "refundable",
  "partially_refundable",
  "non_refundable",
  "unknown",
]);

export const lodgingOfferSummarySchema = z.object({
  provider: z.literal("expedia-rapid"),
  windowId: z.string(),
  windowLabel: z.string(),
  checkin: isoDateStringSchema,
  checkout: isoDateStringSchema,
  nights: z.number().int().positive(),
  propertyId: z.string(),
  roomId: z.string(),
  rateId: z.string(),
  propertyName: z.string(),
  roomName: z.string(),
  imageUrl: z.string().url().nullable(),
  addressLine1: z.string().nullable(),
  city: z.string().nullable(),
  countryCode: z.string().nullable(),
  starRating: z.number().nullable(),
  reviewScore: z.number().nullable(),
  totalPrice: z.number().nonnegative(),
  nightlyPrice: z.number().nonnegative().nullable(),
  currency: z.string().length(3),
  cancellationSummary: z.string(),
  currentRefundability: currentRefundabilitySchema,
  amenities: z.array(z.string()),
});

export const tripSelectedStaySchema = lodgingOfferSummarySchema.extend({
  selectedAt: z.string().datetime(),
});

export const tripStaySearchResultSchema = z.object({
  candidateWindows: z.array(candidateDateWindowSchema),
  offers: z.array(lodgingOfferSummarySchema),
});

export const tripWorkspaceViewSchema = z.object({
  tripDraft: tripDraftSchema,
  execution: tripExecutionSchema.nullable(),
  staySearch: tripStaySearchPreferencesSchema,
  selectedStay: tripSelectedStaySchema.nullable(),
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
export type FeaturedDiscoverCard = z.infer<typeof featuredDiscoverCardSchema>;
export type DiscoverFeedView = z.infer<typeof discoverFeedViewSchema>;
export type DestinationProfileDetail = z.infer<typeof destinationProfileDetailSchema>;
export type DestinationMapCoordinate = z.infer<typeof destinationMapCoordinateSchema>;
export type DestinationMapCameraKeyframe = z.infer<typeof destinationMapCameraKeyframeSchema>;
export type DestinationMapTourStop = z.infer<typeof destinationMapTourStopSchema>;
export type DestinationMapTourView = z.infer<typeof destinationMapTourViewSchema>;
export type DestinationProfileStoryCard = z.infer<typeof destinationProfileStoryCardSchema>;
export type DestinationProfileView = z.infer<typeof destinationProfileViewSchema>;
export type TripDraft = z.infer<typeof tripDraftSchema>;
export type PlanTripInput = z.infer<typeof planTripInputSchema>;
export type TripExecutionSummary = z.infer<typeof tripExecutionSchema>;
export type TripStaySearchInput = z.infer<typeof tripStaySearchInputSchema>;
export type TripStaySearchPreferences = z.infer<typeof tripStaySearchPreferencesSchema>;
export type CandidateDateWindow = z.infer<typeof candidateDateWindowSchema>;
export type LodgingOfferSummary = z.infer<typeof lodgingOfferSummarySchema>;
export type TripSelectedStay = z.infer<typeof tripSelectedStaySchema>;
export type TripStaySearchResult = z.infer<typeof tripStaySearchResultSchema>;
export type TripWorkspaceView = z.infer<typeof tripWorkspaceViewSchema>;
export type TravelerIdentity = z.infer<typeof travelerIdentitySchema>;
export type BookingIntent = z.infer<typeof bookingIntentSchema>;
export type PartnerProfile = z.infer<typeof partnerProfileSchema>;
export type InboxThreadSummary = z.infer<typeof inboxThreadSummarySchema>;
