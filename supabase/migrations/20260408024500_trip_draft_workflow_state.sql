alter table public.trip_drafts
  drop constraint if exists trip_drafts_status_check;

alter table public.trip_drafts
  add column if not exists workflow_id text,
  add column if not exists workflow_run_id text,
  add column if not exists workflow_status text not null default 'not_started',
  add column if not exists plan_summary text;

alter table public.trip_drafts
  add constraint trip_drafts_status_check
    check (status in ('draft', 'planning', 'ready', 'failed'));

alter table public.trip_drafts
  add constraint trip_drafts_workflow_status_check
    check (workflow_status in ('not_started', 'running', 'completed', 'failed'));

create unique index if not exists trip_drafts_workflow_id_idx
  on public.trip_drafts (workflow_id)
  where workflow_id is not null;
