alter table public.destinations
  add column if not exists expedia_region_id text;

alter table public.trip_drafts
  add column if not exists travel_month text,
  add column if not exists trip_nights integer,
  add column if not exists adults integer;

alter table public.trip_drafts
  drop constraint if exists trip_drafts_travel_month_check;

alter table public.trip_drafts
  add constraint trip_drafts_travel_month_check
  check (travel_month is null or travel_month ~ '^\d{4}-\d{2}$');

alter table public.trip_drafts
  drop constraint if exists trip_drafts_trip_nights_check;

alter table public.trip_drafts
  add constraint trip_drafts_trip_nights_check
  check (trip_nights is null or trip_nights > 0);

alter table public.trip_drafts
  drop constraint if exists trip_drafts_adults_check;

alter table public.trip_drafts
  add constraint trip_drafts_adults_check
  check (adults is null or adults > 0);

create table if not exists public.trip_selected_stays (
  trip_draft_id text primary key references public.trip_drafts(id) on delete cascade,
  provider text not null check (provider in ('expedia-rapid')),
  property_id text not null,
  room_id text not null,
  rate_id text not null,
  window_id text not null,
  window_label text not null,
  checkin date not null,
  checkout date not null,
  nights integer not null check (nights > 0),
  property_name text not null,
  room_name text not null,
  image_url text,
  address_line_1 text,
  city text,
  country_code text,
  star_rating double precision,
  review_score double precision,
  total_price numeric(12, 2) not null check (total_price >= 0),
  nightly_price numeric(12, 2) check (nightly_price is null or nightly_price >= 0),
  currency text not null check (char_length(currency) = 3),
  cancellation_summary text not null,
  current_refundability text not null check (
    current_refundability in ('refundable', 'partially_refundable', 'non_refundable', 'unknown')
  ),
  amenities text[] not null default '{}'::text[],
  offer_snapshot jsonb not null default '{}'::jsonb,
  raw_offer jsonb not null default '{}'::jsonb,
  selected_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists destinations_expedia_region_id_idx on public.destinations (expedia_region_id);

drop trigger if exists set_trip_selected_stays_updated_at on public.trip_selected_stays;
create trigger set_trip_selected_stays_updated_at
before update on public.trip_selected_stays
for each row execute function public.set_updated_at();
