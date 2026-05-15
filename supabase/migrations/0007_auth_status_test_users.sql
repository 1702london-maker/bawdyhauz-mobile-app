-- Auth status test users for validating app routing.
-- Password for every account: Bawdyhauz123!
-- Remove or rotate these users before production launch.

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
  ('00000000-0000-0000-0000-000000000000', '10101010-1010-1010-1010-101010101010', 'authenticated', 'authenticated', 'pending@bawdyhauz.com', extensions.crypt('Bawdyhauz123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20202020-2020-2020-2020-202020202020', 'authenticated', 'authenticated', 'approved@bawdyhauz.com', extensions.crypt('Bawdyhauz123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30303030-3030-3030-3030-303030303030', 'authenticated', 'authenticated', 'rejected@bawdyhauz.com', extensions.crypt('Bawdyhauz123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '40404040-4040-4040-4040-404040404040', 'authenticated', 'authenticated', 'waitlisted@bawdyhauz.com', extensions.crypt('Bawdyhauz123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '50505050-5050-5050-5050-505050505050', 'authenticated', 'authenticated', 'restricted@bawdyhauz.com', extensions.crypt('Bawdyhauz123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '60606060-6060-6060-6060-606060606060', 'authenticated', 'authenticated', 'banned@bawdyhauz.com', extensions.crypt('Bawdyhauz123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '70707070-7070-7070-7070-707070707070', 'authenticated', 'authenticated', 'admin@bawdyhauz.com', extensions.crypt('Bawdyhauz123!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = now(),
  updated_at = now();

insert into public.users (id, email, role, standing)
values
  ('10101010-1010-1010-1010-101010101010', 'pending@bawdyhauz.com', 'member', 'clear'),
  ('20202020-2020-2020-2020-202020202020', 'approved@bawdyhauz.com', 'member', 'clear'),
  ('30303030-3030-3030-3030-303030303030', 'rejected@bawdyhauz.com', 'member', 'clear'),
  ('40404040-4040-4040-4040-404040404040', 'waitlisted@bawdyhauz.com', 'member', 'clear'),
  ('50505050-5050-5050-5050-505050505050', 'restricted@bawdyhauz.com', 'member', 'restricted'),
  ('60606060-6060-6060-6060-606060606060', 'banned@bawdyhauz.com', 'member', 'banned'),
  ('70707070-7070-7070-7070-707070707070', 'admin@bawdyhauz.com', 'admin', 'clear')
on conflict (id) do update set
  role = excluded.role,
  standing = excluded.standing,
  updated_at = now();

insert into public.membership_applications (user_id, status, legal_name, city, age_confirmed, intentions, lifestyle_interests, private_notes)
values
  ('10101010-1010-1010-1010-101010101010', 'submitted', 'Pending Test Member', 'London', true, array['Curated dating'], array['Wellness'], 'Pending status test.'),
  ('30303030-3030-3030-3030-303030303030', 'rejected', 'Rejected Test Member', 'London', true, array['Curated dating'], array['Wellness'], 'Rejected status test.'),
  ('40404040-4040-4040-4040-404040404040', 'waitlisted', 'Waitlisted Test Member', 'London', true, array['Curated dating'], array['Wellness'], 'Waitlisted status test.'),
  ('50505050-5050-5050-5050-505050505050', 'approved', 'Restricted Test Member', 'London', true, array['Curated dating'], array['Wellness'], 'Restricted status test.'),
  ('60606060-6060-6060-6060-606060606060', 'approved', 'Banned Test Member', 'London', true, array['Curated dating'], array['Wellness'], 'Banned status test.')
on conflict do nothing;

insert into public.profiles (
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
  ('20202020-2020-2020-2020-202020202020', 'Approved Test Member', 'London', 'Approved routing test profile.', array['Curated dating'], array['Wellness'], 'Approved status test.', 'London', true, false),
  ('50505050-5050-5050-5050-505050505050', 'Restricted Test Member', 'London', 'Restricted routing test profile.', array['Curated dating'], array['Wellness'], 'Restricted status test.', 'London', true, false),
  ('60606060-6060-6060-6060-606060606060', 'Banned Test Member', 'London', 'Banned routing test profile.', array['Curated dating'], array['Wellness'], 'Banned status test.', 'London', true, false)
on conflict do nothing;
