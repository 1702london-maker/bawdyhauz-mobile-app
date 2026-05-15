-- BAWDYHAUZ local/dev seed data.
-- Run after migrations. These records are discreet placeholders for testing flows only.

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
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'member@bawdyhauz.test', crypt('Bawdyhauz123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'admin@bawdyhauz.test', crypt('Bawdyhauz123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'amelia@bawdyhauz.test', crypt('Bawdyhauz123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'marcus@bawdyhauz.test', crypt('Bawdyhauz123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
on conflict (id) do nothing;

insert into public.users (id, email, role, standing)
values
  ('11111111-1111-1111-1111-111111111111', 'member@bawdyhauz.test', 'member', 'clear'),
  ('22222222-2222-2222-2222-222222222222', 'admin@bawdyhauz.test', 'admin', 'clear'),
  ('33333333-3333-3333-3333-333333333333', 'amelia@bawdyhauz.test', 'member', 'clear'),
  ('44444444-4444-4444-4444-444444444444', 'marcus@bawdyhauz.test', 'member', 'clear')
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
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Amelia', 'London', 'A private gallery director with a measured social rhythm, drawn to conversation, design hotels and thoughtful introductions.', array['Long-term connection'], array['Contemporary art', 'Fine dining', 'Wellness', 'Members lounges'], 'Prefers quiet restaurants, late museum evenings and weekends split between London and the coast.', 'London', true, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'Marcus', 'Manchester', 'Founder, collector and early riser. Values warmth, directness and a partner with a life already fully in motion.', array['Curated dating'], array['Architecture', 'Private dinners', 'Travel', 'Culture'], 'Enjoys boutique hotels, slow Sundays and rooms as considered as the menu.', 'Manchester', true, true)
on conflict (id) do nothing;

insert into public.membership_applications (user_id, status, legal_name, city, age_confirmed, intentions, lifestyle_interests, private_notes)
values
  ('11111111-1111-1111-1111-111111111111', 'submitted', 'Test Member', 'London', true, array['Long-term connection'], array['Fine dining', 'Wellness'], 'Seed application awaiting manual review.')
on conflict do nothing;

insert into public.matches (id, profile_a_id, profile_b_id, status)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mutual')
on conflict (profile_a_id, profile_b_id) do nothing;

insert into public.message_threads (id, match_id)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc')
on conflict (id) do nothing;

insert into public.messages (thread_id, sender_user_id, body)
values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Thank you for the introduction. A considered first conversation feels right here.'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'Agreed. I prefer slow, intentional introductions too.');

insert into public.venues (name, city, category, atmosphere)
values
  ('The private dining room', 'London', 'restaurant', 'quiet'),
  ('Low-lit members lounge', 'Manchester', 'members club', 'discreet')
on conflict do nothing;

insert into public.therapists (id, name, title, bio, specialisms, qualifications_placeholder, verified)
values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Dr. Eliana Vale', 'Relationship therapist', 'Discreet support for emotional clarity, communication and post-introduction reflection.', array['Attachment', 'Communication', 'Boundaries'], array['Accreditation placeholder', 'Private practice placeholder'], true),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Mara Ellison', 'Relationship coach', 'Calm preparation for intentional dating, expectations and relational confidence.', array['Dating guidance', 'Confidence', 'Consent'], array['Coaching credential placeholder'], true)
on conflict (id) do nothing;

insert into public.private_experiences (id, title, category, city, event_date, event_time, access_type, description, venue_style_placeholder, dress_code, guest_tone)
values
  ('12121212-1212-1212-1212-121212121212', 'A quiet table for eight', 'private dinner', 'London', 'Thursday 28 May', '20:00', 'invite only', 'A discreet dinner centred on slow conversation, hospitality and considered introductions.', 'Private dining room', 'Evening tailoring', 'Warm, articulate, calm'),
  ('34343434-3434-3434-3434-343434343434', 'Wellness evening', 'wellness evening', 'Bath', 'Sunday 7 June', '17:30', 'members only', 'An intimate evening focused on grounding, boundaries and reflective conversation.', 'Spa residence', 'Soft luxury', 'Restorative and private')
on conflict (id) do nothing;

insert into public.safety_reports (reporter_user_id, target_user_id, reason, details)
values
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'misrepresentation', 'Seed report for moderation queue testing.')
on conflict do nothing;
