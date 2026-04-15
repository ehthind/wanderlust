import crypto from "node:crypto";

import { createSupabaseAdminRequest } from "@wanderlust/shared-supabase";

import { defaultTripBudgetStyle } from "./config";
import type { CreateTripDraftInput, TripWorkspace } from "./types";

type TripDraftRow = {
  id: string;
  destination_id: string;
  traveler_count: number;
  vibe: string;
  budget_style: TripWorkspace["budgetStyle"];
  status: TripWorkspace["status"];
  workflow_id: string | null;
  workflow_run_id: string | null;
  workflow_status: TripWorkspace["workflowStatus"];
  plan_summary: string | null;
  travel_month: string | null;
  trip_nights: number | null;
  adults: number | null;
};

const mapTripDraft = (row: TripDraftRow): TripWorkspace => ({
  id: row.id,
  destinationId: row.destination_id,
  travelerCount: row.traveler_count,
  vibe: row.vibe,
  budgetStyle: row.budget_style,
  status: row.status,
  workflowId: row.workflow_id,
  workflowRunId: row.workflow_run_id,
  workflowStatus: row.workflow_status,
  planSummary: row.plan_summary,
  travelMonth: row.travel_month,
  tripNights: row.trip_nights,
  adults: row.adults,
});

const buildSelectById = (id: string) =>
  new URLSearchParams({
    select: "*",
    id: `eq.${id}`,
    limit: "1",
  });

const buildUpdateById = (id: string) =>
  new URLSearchParams({
    select: "*",
    id: `eq.${id}`,
  });

export const createDraftTripWorkspace = async (
  input: Partial<CreateTripDraftInput> = {},
): Promise<TripWorkspace> => {
  const payload = {
    id: `trip_${crypto.randomUUID()}`,
    destination_id: input.destinationId ?? "dest_paris",
    traveler_count: input.travelerCount ?? 2,
    vibe: input.vibe ?? "romantic",
    budget_style: input.budgetStyle ?? defaultTripBudgetStyle,
    status: "draft",
    workflow_status: "not_started",
    travel_month: null,
    trip_nights: null,
    adults: null,
  };

  const rows = (await createSupabaseAdminRequest({
    table: "trip_drafts",
    method: "POST",
    query: new URLSearchParams({ select: "*" }),
    body: payload,
    prefer: "return=representation",
  })) as TripDraftRow[];

  const row = rows[0];
  if (!row) {
    throw new Error("Supabase did not return the created trip draft.");
  }

  return mapTripDraft(row);
};

export const loadTripWorkspaceById = async (id: string): Promise<TripWorkspace | null> => {
  const rows = (await createSupabaseAdminRequest({
    table: "trip_drafts",
    query: buildSelectById(id),
  })) as TripDraftRow[];

  const row = rows[0];
  return row ? mapTripDraft(row) : null;
};

export const updateTripWorkspace = async (
  id: string,
  updates: Partial<{
    status: TripWorkspace["status"];
    workflowId: string | null;
    workflowRunId: string | null;
    workflowStatus: TripWorkspace["workflowStatus"];
    planSummary: string | null;
    travelMonth: string | null;
    tripNights: number | null;
    adults: number | null;
  }>,
): Promise<TripWorkspace> => {
  const payload = Object.fromEntries(
    Object.entries({
      ...(updates.status ? { status: updates.status } : {}),
      ...(updates.workflowId !== undefined ? { workflow_id: updates.workflowId } : {}),
      ...(updates.workflowRunId !== undefined ? { workflow_run_id: updates.workflowRunId } : {}),
      ...(updates.workflowStatus ? { workflow_status: updates.workflowStatus } : {}),
      ...(updates.planSummary !== undefined ? { plan_summary: updates.planSummary } : {}),
      ...(updates.travelMonth !== undefined ? { travel_month: updates.travelMonth } : {}),
      ...(updates.tripNights !== undefined ? { trip_nights: updates.tripNights } : {}),
      ...(updates.adults !== undefined ? { adults: updates.adults } : {}),
    }).filter(([, value]) => value !== undefined),
  );

  const rows = (await createSupabaseAdminRequest({
    table: "trip_drafts",
    method: "PATCH",
    query: buildUpdateById(id),
    body: payload,
    prefer: "return=representation",
  })) as TripDraftRow[];

  const row = rows[0];
  if (!row) {
    throw new Error(`Trip draft ${id} was not found after update.`);
  }

  return mapTripDraft(row);
};
