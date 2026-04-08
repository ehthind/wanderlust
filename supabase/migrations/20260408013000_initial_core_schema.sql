create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.destinations (
  id text primary key,
  slug text not null unique,
  city text not null,
  country text not null,
  thesis text not null,
  best_season text not null,
  budget text not null,
  visa text not null,
  ideal_trip_length text not null,
  why_go text not null,
  story_categories text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.travelers (
  id text primary key,
  mode text not null check (mode in ('guest', 'account')),
  email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trip_drafts (
  id text primary key,
  destination_id text not null references public.destinations(id) on delete cascade,
  traveler_count integer not null check (traveler_count > 0),
  vibe text not null,
  budget_style text not null check (budget_style in ('lean', 'balanced', 'luxury')),
  status text not null default 'draft' check (status in ('draft')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.booking_intents (
  id text primary key,
  destination_id text not null references public.destinations(id) on delete cascade,
  status text not null check (status in ('draft', 'priced', 'confirmed', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.partner_profiles (
  id text primary key,
  kind text not null check (kind in ('hostel', 'hotel', 'guide', 'experience')),
  display_name text not null,
  payout_ready boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inbox_threads (
  id text primary key,
  subject text not null,
  kind text not null check (kind in ('concierge', 'booking', 'recovery')),
  unread_count integer not null default 0 check (unread_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists trip_drafts_destination_id_idx on public.trip_drafts (destination_id);
create index if not exists booking_intents_destination_id_idx on public.booking_intents (destination_id);
create index if not exists booking_intents_status_idx on public.booking_intents (status);
create index if not exists inbox_threads_kind_idx on public.inbox_threads (kind);

drop trigger if exists set_destinations_updated_at on public.destinations;
create trigger set_destinations_updated_at
before update on public.destinations
for each row execute function public.set_updated_at();

drop trigger if exists set_travelers_updated_at on public.travelers;
create trigger set_travelers_updated_at
before update on public.travelers
for each row execute function public.set_updated_at();

drop trigger if exists set_trip_drafts_updated_at on public.trip_drafts;
create trigger set_trip_drafts_updated_at
before update on public.trip_drafts
for each row execute function public.set_updated_at();

drop trigger if exists set_booking_intents_updated_at on public.booking_intents;
create trigger set_booking_intents_updated_at
before update on public.booking_intents
for each row execute function public.set_updated_at();

drop trigger if exists set_partner_profiles_updated_at on public.partner_profiles;
create trigger set_partner_profiles_updated_at
before update on public.partner_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_inbox_threads_updated_at on public.inbox_threads;
create trigger set_inbox_threads_updated_at
before update on public.inbox_threads
for each row execute function public.set_updated_at();
