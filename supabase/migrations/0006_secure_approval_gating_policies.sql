-- Tighten client-side permissions now that real auth and approval gating are active.

drop policy if exists "users can update own user row limited" on public.users;

drop policy if exists "users manage own profile" on public.profiles;
drop policy if exists "users manage own applications" on public.membership_applications;

create policy "users read own profile" on public.profiles
for select using (user_id = auth.uid());

create policy "users create own unapproved profile" on public.profiles
for insert with check (
  user_id = auth.uid()
  and is_approved = false
  and is_public_safe = false
);

create policy "users update own unapproved profile fields" on public.profiles
for update using (
  user_id = auth.uid()
  and is_approved = false
) with check (
  user_id = auth.uid()
  and is_approved = false
  and is_public_safe = false
);

create policy "users read own applications" on public.membership_applications
for select using (user_id = auth.uid());

create policy "users create own submitted applications" on public.membership_applications
for insert with check (
  user_id = auth.uid()
  and status in ('draft', 'submitted')
);

create policy "users update own draft applications" on public.membership_applications
for update using (
  user_id = auth.uid()
  and status in ('draft', 'submitted', 'more_information')
) with check (
  user_id = auth.uid()
  and status in ('draft', 'submitted')
);
