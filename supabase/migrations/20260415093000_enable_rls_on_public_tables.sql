alter table public.destinations enable row level security;
alter table public.travelers enable row level security;
alter table public.trip_drafts enable row level security;
alter table public.booking_intents enable row level security;
alter table public.partner_profiles enable row level security;
alter table public.inbox_threads enable row level security;

alter table public.destinations force row level security;
alter table public.travelers force row level security;
alter table public.trip_drafts force row level security;
alter table public.booking_intents force row level security;
alter table public.partner_profiles force row level security;
alter table public.inbox_threads force row level security;
