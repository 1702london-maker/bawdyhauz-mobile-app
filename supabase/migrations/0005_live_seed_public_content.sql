-- Public-safe live seed content for testing member-facing reads and interaction flows.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'amelia.seed@bawdyhauz.com',
    null,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'marcus.seed@bawdyhauz.com',
    null,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  )
on conflict (id) do nothing;

insert into public.users (id, email, role, standing)
values
  ('33333333-3333-3333-3333-333333333333', 'amelia.seed@bawdyhauz.com', 'member', 'clear'),
  ('44444444-4444-4444-4444-444444444444', 'marcus.seed@bawdyhauz.com', 'member', 'clear')
on conflict (id) do nothing;

insert into public.profiles (
  id,
  user_id,
  display_name,
  city,
  bio,
  intentions,
  interests,
  lifestyle_notes,
  preferred_introduction_city,
  is_approved,
  is_public_safe
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333',
    'Amelia',
    'London',
    'A private gallery director with a measured social rhythm, drawn to conversation, design hotels and thoughtful introductions.',
    array['Long-term connection'],
    array['Contemporary art', 'Fine dining', 'Wellness', 'Members lounges'],
    'Prefers quiet restaurants, late museum evenings and weekends split between London and the coast.',
    'London',
    true,
    true
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '44444444-4444-4444-4444-444444444444',
    'Marcus',
    'Manchester',
    'Founder, collector and early riser. Values warmth, directness and a partner with a life already fully in motion.',
    array['Curated dating'],
    array['Architecture', 'Private dinners', 'Travel', 'Culture'],
    'Enjoys boutique hotels, slow Sundays and restaurants where the room is as considered as the menu.',
    'Manchester',
    true,
    true
  )
on conflict (id) do update set
  bio = excluded.bio,
  interests = excluded.interests,
  intentions = excluded.intentions,
  is_approved = true,
  is_public_safe = true,
  updated_at = now();

insert into public.therapists (
  id,
  name,
  title,
  bio,
  specialisms,
  qualifications_placeholder,
  verified
)
values
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Dr. Eliana Vale',
    'Relationship therapist',
    'Discreet support for emotional clarity, communication and post-introduction reflection.',
    array['Attachment', 'Communication', 'Boundaries'],
    array['Accreditation placeholder', 'Private practice placeholder'],
    true
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'Mara Ellison',
    'Relationship coach',
    'Calm preparation for intentional dating, expectations and relational confidence.',
    array['Dating guidance', 'Confidence', 'Consent'],
    array['Coaching credential placeholder'],
    true
  )
on conflict (id) do update set
  bio = excluded.bio,
  specialisms = excluded.specialisms,
  verified = true;

insert into public.private_experiences (
  id,
  title,
  category,
  city,
  event_date,
  event_time,
  access_type,
  description,
  venue_style_placeholder,
  dress_code,
  guest_tone
)
values
  (
    '12121212-1212-1212-1212-121212121212',
    'A quiet table for eight',
    'private dinners',
    'London',
    'Thursday 28 May',
    '20:00',
    'invite only',
    'A discreet dinner centred on slow conversation, hospitality and considered introductions.',
    'Private dining room',
    'Evening tailoring',
    'Warm, articulate, calm'
  ),
  (
    '34343434-3434-3434-3434-343434343434',
    'Wellness evening',
    'wellness evenings',
    'Bath',
    'Sunday 7 June',
    '17:30',
    'members only',
    'An intimate evening focused on grounding, boundaries and reflective conversation.',
    'Spa residence',
    'Soft luxury',
    'Restorative and private'
  )
on conflict (id) do update set
  description = excluded.description,
  access_type = excluded.access_type;
