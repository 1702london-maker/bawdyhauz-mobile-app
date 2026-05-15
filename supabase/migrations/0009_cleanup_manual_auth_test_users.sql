-- Remove manually seeded Auth test users that do not satisfy Supabase Auth internals.
-- Create test users through Supabase Authentication instead, then configure their public status.

delete from auth.identities
where provider = 'email'
  and provider_id in (
    '10101010-1010-1010-1010-101010101010',
    '20202020-2020-2020-2020-202020202020',
    '30303030-3030-3030-3030-303030303030',
    '40404040-4040-4040-4040-404040404040',
    '50505050-5050-5050-5050-505050505050',
    '60606060-6060-6060-6060-606060606060',
    '70707070-7070-7070-7070-707070707070'
  );

delete from auth.users
where email in (
  'pending@bawdyhauz.com',
  'approved@bawdyhauz.com',
  'rejected@bawdyhauz.com',
  'waitlisted@bawdyhauz.com',
  'restricted@bawdyhauz.com',
  'banned@bawdyhauz.com',
  'admin@bawdyhauz.com'
);

create or replace function public.configure_test_account(test_email text, target_state text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where email = test_email
  limit 1;

  if target_user_id is null then
    raise exception 'No auth user found for %', test_email;
  end if;

  insert into public.users (id, email, role, standing)
  values (
    target_user_id,
    test_email,
    case when target_state = 'admin' then 'admin'::public.user_role else 'member'::public.user_role end,
    case
      when target_state = 'restricted' then 'restricted'::public.user_standing
      when target_state = 'banned' then 'banned'::public.user_standing
      else 'clear'::public.user_standing
    end
  )
  on conflict (id) do update set
    role = excluded.role,
    standing = excluded.standing,
    updated_at = now();

  if target_state in ('pending', 'rejected', 'waitlisted') then
    insert into public.membership_applications (
      user_id,
      status,
      legal_name,
      city,
      age_confirmed,
      intentions,
      lifestyle_interests,
      private_notes
    )
    values (
      target_user_id,
      case
        when target_state = 'rejected' then 'rejected'::public.application_status
        when target_state = 'waitlisted' then 'waitlisted'::public.application_status
        else 'submitted'::public.application_status
      end,
      initcap(split_part(test_email, '@', 1)) || ' Test Member',
      'London',
      true,
      array['Curated dating'],
      array['Wellness'],
      'Configured auth routing test account.'
    );
  end if;

  if target_state in ('approved', 'restricted', 'banned', 'admin') then
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
    values (
      target_user_id,
      initcap(split_part(test_email, '@', 1)) || ' Test Member',
      'London',
      'Configured auth routing test profile.',
      array['Curated dating'],
      array['Wellness'],
      'Configured auth routing test account.',
      'London',
      true,
      false
    );
  end if;
end;
$$;
