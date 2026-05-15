-- BAWDYHAUZ RLS foundation.
-- Policies are intentionally conservative. Review before applying to production.

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_thread_member(thread_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.message_threads mt
    join public.matches m on m.id = mt.match_id
    join public.profiles pa on pa.id = m.profile_a_id
    join public.profiles pb on pb.id = m.profile_b_id
    where mt.id = thread_uuid
      and (pa.user_id = auth.uid() or pb.user_id = auth.uid())
  )
$$;

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.membership_applications enable row level security;
alter table public.verification_checks enable row level security;
alter table public.matches enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.video_dates enable row level security;
alter table public.concierge_requests enable row level security;
alter table public.venues enable row level security;
alter table public.date_bookings enable row level security;
alter table public.therapists enable row level security;
alter table public.therapy_sessions enable row level security;
alter table public.private_experiences enable row level security;
alter table public.experience_rsvps enable row level security;
alter table public.experience_waitlists enable row level security;
alter table public.reviews enable row level security;
alter table public.safety_reports enable row level security;
alter table public.incidents enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.admin_notes enable row level security;
alter table public.audit_logs enable row level security;

create policy "users can read own user row" on public.users for select using (id = auth.uid() or public.is_admin());
create policy "users can update own user row limited" on public.users for update using (id = auth.uid()) with check (id = auth.uid());

create policy "approved profiles are public safe to members" on public.profiles
for select using (is_approved = true and is_public_safe = true);
create policy "users manage own profile" on public.profiles
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "users manage own applications" on public.membership_applications
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins manage applications" on public.membership_applications
for all using (public.is_admin()) with check (public.is_admin());

create policy "users read own verification" on public.verification_checks
for select using (user_id = auth.uid() or public.is_admin());
create policy "users create own verification" on public.verification_checks
for insert with check (user_id = auth.uid());
create policy "admins manage verification" on public.verification_checks
for all using (public.is_admin()) with check (public.is_admin());

create policy "members read their matches" on public.matches
for select using (
  public.is_admin() or exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and (p.id = profile_a_id or p.id = profile_b_id)
  )
);
create policy "admins manage matches" on public.matches for all using (public.is_admin()) with check (public.is_admin());

create policy "thread members read threads" on public.message_threads
for select using (public.is_admin() or public.is_thread_member(id));
create policy "thread members read messages" on public.messages
for select using (public.is_admin() or public.is_thread_member(thread_id));
create policy "thread members send messages" on public.messages
for insert with check (sender_user_id = auth.uid() and public.is_thread_member(thread_id));

create policy "members read own video dates" on public.video_dates
for select using (public.is_admin() or exists (
  select 1 from public.matches m
  join public.profiles pa on pa.id = m.profile_a_id
  join public.profiles pb on pb.id = m.profile_b_id
  where m.id = match_id and (pa.user_id = auth.uid() or pb.user_id = auth.uid())
));
create policy "admins manage video dates" on public.video_dates for all using (public.is_admin()) with check (public.is_admin());

create policy "users create own concierge requests" on public.concierge_requests
for insert with check (requester_user_id = auth.uid());
create policy "users read own concierge requests" on public.concierge_requests
for select using (requester_user_id = auth.uid() or public.is_admin());
create policy "admins manage concierge requests" on public.concierge_requests for all using (public.is_admin()) with check (public.is_admin());

create policy "members read venue safe list" on public.venues for select using (true);
create policy "admins manage venues" on public.venues for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage date bookings" on public.date_bookings for all using (public.is_admin()) with check (public.is_admin());

create policy "members read therapists" on public.therapists for select using (verified = true or public.is_admin());
create policy "admins manage therapists" on public.therapists for all using (public.is_admin()) with check (public.is_admin());
create policy "users create own therapy sessions" on public.therapy_sessions for insert with check (user_id = auth.uid());
create policy "users read own therapy sessions" on public.therapy_sessions for select using (user_id = auth.uid() or public.is_admin());
create policy "admins manage therapy sessions" on public.therapy_sessions for all using (public.is_admin()) with check (public.is_admin());

create policy "members read experiences" on public.private_experiences for select using (true);
create policy "admins manage experiences" on public.private_experiences for all using (public.is_admin()) with check (public.is_admin());
create policy "users manage own rsvps" on public.experience_rsvps for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins manage rsvps" on public.experience_rsvps for all using (public.is_admin()) with check (public.is_admin());
create policy "users manage own waitlists" on public.experience_waitlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins manage waitlists" on public.experience_waitlists for all using (public.is_admin()) with check (public.is_admin());

create policy "users create own reviews" on public.reviews for insert with check (reviewer_user_id = auth.uid());
create policy "users read own reviews" on public.reviews for select using (reviewer_user_id = auth.uid() or public.is_admin());

create policy "users create private reports" on public.safety_reports for insert with check (reporter_user_id = auth.uid());
create policy "users read own reports" on public.safety_reports for select using (reporter_user_id = auth.uid() or public.is_admin());
create policy "admins manage reports" on public.safety_reports for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage incidents" on public.incidents for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage moderation actions" on public.moderation_actions for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage notes" on public.admin_notes for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit logs" on public.audit_logs for select using (public.is_admin());
create policy "admins create audit logs" on public.audit_logs for insert with check (public.is_admin());
