-- Ensure configured auth-routing test accounts have the intended profile rows.

delete from public.profiles p
using public.profiles older
where p.user_id = older.user_id
  and p.ctid < older.ctid;

create unique index if not exists profiles_user_id_unique on public.profiles(user_id);

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
    )
    on conflict (user_id) do update set
      display_name = excluded.display_name,
      city = excluded.city,
      bio = excluded.bio,
      intentions = excluded.intentions,
      interests = excluded.interests,
      lifestyle_notes = excluded.lifestyle_notes,
      preferred_introduction_city = excluded.preferred_introduction_city,
      is_approved = true,
      updated_at = now();
  end if;
end;
$$;
