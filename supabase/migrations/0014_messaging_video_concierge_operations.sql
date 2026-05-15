-- Messaging, video introduction, and concierge operations foundation.

alter type public.booking_status add value if not exists 'requested';
alter type public.booking_status add value if not exists 'planning';
alter type public.booking_status add value if not exists 'options_sent';

alter table public.messages
  add column if not exists delivery_status text not null default 'sent',
  add column if not exists moderation_status text not null default 'clear',
  add column if not exists reported_at timestamptz;

alter table public.video_dates
  add column if not exists proposed_by_user_id uuid references public.users(id) on delete set null,
  add column if not exists confirmed_by_user_id uuid references public.users(id) on delete set null,
  add column if not exists confirmation_status text not null default 'awaiting_confirmation',
  add column if not exists completed_at timestamptz,
  add column if not exists integration_provider_placeholder text;

alter table public.concierge_requests
  add column if not exists venue_category text,
  add column if not exists dietary_accessibility_notes text,
  add column if not exists privacy_preferences text,
  add column if not exists selected_venue_id uuid references public.venues(id) on delete set null;

alter table public.date_bookings
  add column if not exists selected_by_user_id uuid references public.users(id) on delete set null,
  add column if not exists admin_notes text;

create or replace function public.is_match_participant(match_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matches m
    join public.profiles pa on pa.id = m.profile_a_id
    join public.profiles pb on pb.id = m.profile_b_id
    where m.id = match_uuid
      and (pa.user_id = auth.uid() or pb.user_id = auth.uid())
  )
$$;

create or replace function public.get_or_create_message_thread(match_uuid uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  thread_uuid uuid;
begin
  if not public.is_admin() and not public.is_match_participant(match_uuid) then
    raise exception 'not authorised for this match';
  end if;

  select id into thread_uuid
  from public.message_threads
  where match_id = match_uuid
  limit 1;

  if thread_uuid is null then
    insert into public.message_threads(match_id)
    values (match_uuid)
    returning id into thread_uuid;
  end if;

  return thread_uuid;
end;
$$;

create or replace function public.audit_reported_message(message_uuid uuid, report_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_uuid uuid;
begin
  if not exists (
    select 1
    from public.messages m
    where m.id = message_uuid
      and public.is_thread_member(m.thread_id)
  ) then
    raise exception 'not authorised for this message';
  end if;

  update public.messages
  set moderation_status = 'reported',
      reported_at = now()
  where id = message_uuid;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'message_reported',
    'message',
    message_uuid,
    jsonb_build_object('reason', report_reason)
  )
  returning id into audit_uuid;

  return audit_uuid;
end;
$$;

create policy "thread members create threads through checks" on public.message_threads
for insert with check (public.is_admin() or public.is_match_participant(match_id));

create policy "thread members read own video dates" on public.video_dates
for insert with check (public.is_match_participant(match_id) and proposed_by_user_id = auth.uid());

create policy "thread members update own video dates" on public.video_dates
for update using (public.is_match_participant(match_id)) with check (public.is_match_participant(match_id));

create policy "match participants read concierge requests" on public.concierge_requests
for select using (
  public.is_admin()
  or requester_user_id = auth.uid()
  or (match_id is not null and public.is_match_participant(match_id))
);

create policy "match participants update concierge selections" on public.concierge_requests
for update using (match_id is not null and public.is_match_participant(match_id))
with check (match_id is not null and public.is_match_participant(match_id));

create policy "match participants read date bookings" on public.date_bookings
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.concierge_requests cr
    where cr.id = concierge_request_id
      and (
        cr.requester_user_id = auth.uid()
        or (cr.match_id is not null and public.is_match_participant(cr.match_id))
      )
  )
);

create policy "users create report audit logs" on public.audit_logs
for insert with check (actor_user_id = auth.uid() and action = 'message_reported');
