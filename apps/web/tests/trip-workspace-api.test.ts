import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookingServiceError } from "@wanderlust/domains/bookings";

const { createTripWorkspaceService, createBookingService } = vi.hoisted(() => ({
  createTripWorkspaceService: vi.fn(),
  createBookingService: vi.fn(),
}));

vi.mock("@wanderlust/domains/trips", () => ({
  createTripWorkspaceService,
}));

vi.mock("@wanderlust/domains/bookings", async () => {
  const actual = await vi.importActual<typeof import("@wanderlust/domains/bookings")>(
    "@wanderlust/domains/bookings",
  );

  return {
    ...actual,
    createBookingService,
  };
});

const buildTripDraft = () => ({
  id: "trip_123",
  destinationId: "dest_paris",
  travelerCount: 2,
  vibe: "romantic",
  budgetStyle: "balanced" as const,
  status: "planning" as const,
  workflowId: "wf_123",
  workflowRunId: "run_123",
  workflowStatus: "running" as const,
  planSummary: null,
  travelMonth: "2026-05",
  tripNights: 3,
  adults: 2,
});

const buildOffer = () => ({
  provider: "expedia-rapid" as const,
  windowId: "2026-05-02_2026-05-05",
  windowLabel: "Fri, May 2 - Mon, May 5",
  checkin: "2026-05-02",
  checkout: "2026-05-05",
  nights: 3,
  propertyId: "1",
  roomId: "room_1",
  rateId: "rate_1",
  propertyName: "Maison Rive",
  roomName: "River Suite",
  imageUrl: "https://example.test/maison.jpg",
  addressLine1: "2 Saint Germain",
  city: "Paris",
  countryCode: "FR",
  starRating: 5,
  reviewScore: 9.3,
  totalPrice: 230,
  nightlyPrice: 76.67,
  currency: "USD",
  cancellationSummary: "Partially refundable",
  currentRefundability: "partially_refundable" as const,
  amenities: ["Spa"],
});

describe("trip workspace and stay APIs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the composed trip workspace view", async () => {
    createTripWorkspaceService.mockReturnValue({
      loadTripWorkspace: vi.fn().mockResolvedValue(buildTripDraft()),
      loadTripExecution: vi.fn().mockResolvedValue({
        workflowId: "wf_123",
        runId: "run_123",
        status: "running",
      }),
    });
    createBookingService.mockReturnValue({
      loadSelectedStay: vi.fn().mockResolvedValue({
        ...buildOffer(),
        selectedAt: "2026-04-15T00:00:00.000Z",
      }),
    });

    const { GET } = await import("../src/app/api/trips/[tripDraftId]/route");
    const response = await GET(new Request("https://wanderlust.test/api/trips/trip_123"), {
      params: Promise.resolve({ tripDraftId: "trip_123" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      tripDraft: buildTripDraft(),
      execution: {
        workflowId: "wf_123",
        runId: "run_123",
        status: "running",
      },
      staySearch: {
        travelMonth: "2026-05",
        tripNights: 3,
        adults: 2,
      },
      selectedStay: {
        ...buildOffer(),
        selectedAt: "2026-04-15T00:00:00.000Z",
      },
    });
  });

  it("returns 404 when the trip workspace is missing", async () => {
    createTripWorkspaceService.mockReturnValue({
      loadTripWorkspace: vi.fn().mockResolvedValue(null),
      loadTripExecution: vi.fn(),
    });
    createBookingService.mockReturnValue({
      loadSelectedStay: vi.fn(),
    });

    const { GET } = await import("../src/app/api/trips/[tripDraftId]/route");
    const response = await GET(new Request("https://wanderlust.test/api/trips/missing"), {
      params: Promise.resolve({ tripDraftId: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
    });
  });

  it("returns 400 for invalid stay search input", async () => {
    createBookingService.mockReturnValue({
      searchTripStays: vi.fn(),
    });

    const { POST } = await import("../src/app/api/trips/[tripDraftId]/stays/search/route");
    const response = await POST(
      new Request("https://wanderlust.test/api/trips/trip_123/stays/search", {
        method: "POST",
        body: JSON.stringify({
          travelMonth: "May 2026",
          tripNights: 0,
          adults: 0,
        }),
      }),
      {
        params: Promise.resolve({ tripDraftId: "trip_123" }),
      },
    );

    expect(response.status).toBe(400);
  });

  it("returns empty results when the search succeeds without offers", async () => {
    createBookingService.mockReturnValue({
      searchTripStays: vi.fn().mockResolvedValue({
        candidateWindows: [],
        offers: [],
      }),
    });

    const { POST } = await import("../src/app/api/trips/[tripDraftId]/stays/search/route");
    const response = await POST(
      new Request("https://wanderlust.test/api/trips/trip_123/stays/search", {
        method: "POST",
        body: JSON.stringify({
          travelMonth: "2026-05",
          tripNights: 3,
          adults: 2,
        }),
      }),
      {
        params: Promise.resolve({ tripDraftId: "trip_123" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      candidateWindows: [],
      offers: [],
    });
  });

  it("maps missing Expedia region mappings to 409", async () => {
    createBookingService.mockReturnValue({
      searchTripStays: vi
        .fn()
        .mockRejectedValue(
          new BookingServiceError(
            "missing_region_mapping",
            "Destination dest_paris is missing an Expedia region mapping.",
          ),
        ),
    });

    const { POST } = await import("../src/app/api/trips/[tripDraftId]/stays/search/route");
    const response = await POST(
      new Request("https://wanderlust.test/api/trips/trip_123/stays/search", {
        method: "POST",
        body: JSON.stringify({
          travelMonth: "2026-05",
          tripNights: 3,
          adults: 2,
        }),
      }),
      {
        params: Promise.resolve({ tripDraftId: "trip_123" }),
      },
    );

    expect(response.status).toBe(409);
  });

  it("maps upstream availability failures to 502", async () => {
    createBookingService.mockReturnValue({
      searchTripStays: vi
        .fn()
        .mockRejectedValue(
          new BookingServiceError(
            "availability_upstream_failure",
            "Expedia Rapid availability search failed.",
          ),
        ),
    });

    const { POST } = await import("../src/app/api/trips/[tripDraftId]/stays/search/route");
    const response = await POST(
      new Request("https://wanderlust.test/api/trips/trip_123/stays/search", {
        method: "POST",
        body: JSON.stringify({
          travelMonth: "2026-05",
          tripNights: 3,
          adults: 2,
        }),
      }),
      {
        params: Promise.resolve({ tripDraftId: "trip_123" }),
      },
    );

    expect(response.status).toBe(502);
  });

  it("persists the selected stay", async () => {
    createBookingService.mockReturnValue({
      selectTripStay: vi.fn().mockResolvedValue({
        ...buildOffer(),
        selectedAt: "2026-04-15T00:00:00.000Z",
      }),
    });

    const { POST } = await import("../src/app/api/trips/[tripDraftId]/stays/select/route");
    const response = await POST(
      new Request("https://wanderlust.test/api/trips/trip_123/stays/select", {
        method: "POST",
        body: JSON.stringify(buildOffer()),
      }),
      {
        params: Promise.resolve({ tripDraftId: "trip_123" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      propertyId: "1",
      selectedAt: "2026-04-15T00:00:00.000Z",
    });
  });
});
