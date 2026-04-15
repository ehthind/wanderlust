insert into public.destinations (
  id,
  slug,
  city,
  country,
  thesis,
  best_season,
  budget,
  visa,
  ideal_trip_length,
  why_go,
  story_categories,
  expedia_region_id
)
values
  (
    'dest_paris',
    'paris',
    'Paris',
    'France',
    'Go for the late-night glow, layered history, and beauty as part of daily life.',
    'Apr-Oct',
    '$$$',
    'Visa-free',
    '4-7 days',
    'Paris makes romance feel practical: neighborhood cafés, river light, dense culture, and beauty you do not have to schedule.',
    array['Food', 'Culture', 'Neighborhoods', 'Vibe'],
    '179898'
  ),
  (
    'dest_kyoto',
    'kyoto',
    'Kyoto',
    'Japan',
    'Go for temple mornings, quiet lanes, and a city that rewards moving slower than your itinerary.',
    'Mar-May',
    '$$-$$$',
    'Visa-free',
    '4-6 days',
    'Kyoto turns restraint into atmosphere: cedar-lined paths, tea houses, gardens, and evenings that feel hushed instead of empty.',
    array['Temples', 'Food', 'Craft', 'Stillness'],
    '6131486'
  ),
  (
    'dest_mexico_city',
    'mexico-city',
    'Mexico City',
    'Mexico',
    'Go for design energy, serious food, and neighborhoods that make a long weekend feel much larger.',
    'Oct-Apr',
    '$$',
    'Visa-free',
    '4-5 days',
    'Mexico City layers galleries, parks, ambitious restaurants, and street life into a pace that feels both cosmopolitan and warm.',
    array['Food', 'Design', 'Neighborhoods', 'Nightlife'],
    '178285'
  )
on conflict (id) do update
set
  slug = excluded.slug,
  city = excluded.city,
  country = excluded.country,
  thesis = excluded.thesis,
  best_season = excluded.best_season,
  budget = excluded.budget,
  visa = excluded.visa,
  ideal_trip_length = excluded.ideal_trip_length,
  why_go = excluded.why_go,
  story_categories = excluded.story_categories,
  expedia_region_id = excluded.expedia_region_id;

insert into public.travelers (id, mode, email)
values ('traveler_guest', 'guest', null)
on conflict (id) do update
set
  mode = excluded.mode,
  email = excluded.email;

insert into public.trip_drafts (id, destination_id, traveler_count, vibe, budget_style, status)
values ('trip_paris_draft', 'dest_paris', 2, 'romantic', 'balanced', 'draft')
on conflict (id) do update
set
  destination_id = excluded.destination_id,
  traveler_count = excluded.traveler_count,
  vibe = excluded.vibe,
  budget_style = excluded.budget_style,
  status = excluded.status;

insert into public.booking_intents (id, destination_id, status)
values ('booking_preview_paris', 'dest_paris', 'priced')
on conflict (id) do update
set
  destination_id = excluded.destination_id,
  status = excluded.status;

insert into public.partner_profiles (id, kind, display_name, payout_ready)
values ('partner_paris_house', 'hostel', 'Paris House', false)
on conflict (id) do update
set
  kind = excluded.kind,
  display_name = excluded.display_name,
  payout_ready = excluded.payout_ready;

insert into public.inbox_threads (id, subject, kind, unread_count)
values ('thread_paris_intro', 'Your Paris planning thread', 'concierge', 0)
on conflict (id) do update
set
  subject = excluded.subject,
  kind = excluded.kind,
  unread_count = excluded.unread_count;
