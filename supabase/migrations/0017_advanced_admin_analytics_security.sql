-- Phase 11-13: advanced admin moderation, privacy-first analytics, and security hardening foundations.

create or replace function public.current_user_can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.standing not in ('restricted', 'suspended', 'banned')
    ),
    false
  )
$$;

alter table public.safety_reports
  add column if not exists status public.incident_status not null default 'report_received',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by_admin_id uuid references public.users(id) on delete set null;

alter table public.incidents
  add column if not exists severity text not null default 'standard' check (severity in ('low', 'standard', 'high', 'critical')),
  add column if not exists escalation_level integer not null default 0 check (escalation_level between 0 and 5),
  add column if not exists escalation_reason text,
  add column if not exists escalated_at timestamptz,
  add column if not exists ai_recommendation_summary text,
  add column if not exists ai_recommendation_status text not null default 'review_required',
  add column if not exists reviewer_notes text,
  add column if not exists resolution_summary text,
  add column if not exists resolved_at timestamptz;

alter table public.moderation_actions
  add column if not exists action_category text not null default 'moderation',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists review_only boolean not null default false;

create table if not exists public.incident_evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade,
  safety_report_id uuid references public.safety_reports(id) on delete cascade,
  submitted_by_user_id uuid references public.users(id) on delete set null,
  bucket_id text not null default 'report-evidence',
  storage_path text,
  evidence_type text not null default 'member_upload',
  evidence_summary text,
  is_sensitive boolean not null default true,
  reviewed_by_admin_id uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_trust_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  trust_score integer not null default 75 check (trust_score between 0 and 100),
  standing public.user_standing not null default 'clear',
  signal_summary text,
  source text not null default 'manual_review',
  created_by_admin_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.flagged_behaviour_reviews (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid references public.users(id) on delete cascade,
  incident_id uuid references public.incidents(id) on delete set null,
  signal_type text not null,
  severity text not null default 'review' check (severity in ('review', 'elevated', 'urgent')),
  summary text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'escalated')),
  ai_recommendation_id uuid references public.ai_recommendations(id) on delete set null,
  reviewed_by_admin_id uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  source_area text not null default 'mobile',
  session_id_hash text,
  user_role text,
  metadata_sanitized jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null default current_date,
  metric_key text not null,
  metric_value numeric not null default 0,
  dimensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(metric_date, metric_key, dimensions)
);

create table if not exists public.conversion_funnels (
  id uuid primary key default gen_random_uuid(),
  funnel_key text not null,
  step_key text not null,
  step_order integer not null default 0,
  aggregate_count integer not null default 0,
  conversion_rate numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(funnel_key, step_key)
);

create table if not exists public.cohort_metrics (
  id uuid primary key default gen_random_uuid(),
  cohort_key text not null,
  metric_key text not null,
  metric_value numeric not null default 0,
  period_start date,
  period_end date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  route_key text not null,
  window_key text not null,
  event_count integer not null default 1,
  limited boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.suspicious_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  signal_type text not null,
  severity text not null default 'review' check (severity in ('review', 'elevated', 'urgent')),
  summary text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'escalated')),
  metadata jsonb not null default '{}'::jsonb,
  reviewed_by_admin_id uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.abuse_detection_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  signal_type text not null,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  recommendation text,
  status text not null default 'review_required' check (status in ('review_required', 'reviewed', 'dismissed')),
  ai_review_only boolean not null default true,
  created_at timestamptz not null default now(),
  reviewed_by_admin_id uuid references public.users(id) on delete set null,
  reviewed_at timestamptz
);

create table if not exists public.blocked_devices (
  id uuid primary key default gen_random_uuid(),
  device_hash text not null unique,
  reason text,
  status text not null default 'active' check (status in ('active', 'review', 'lifted')),
  created_by_admin_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_emails (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null unique,
  reason text,
  status text not null default 'active' check (status in ('active', 'review', 'lifted')),
  created_by_admin_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_phone_numbers (
  id uuid primary key default gen_random_uuid(),
  phone_hash text not null unique,
  reason text,
  status text not null default 'active' check (status in ('active', 'review', 'lifted')),
  created_by_admin_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  device_label text,
  platform text,
  session_hash text,
  status text not null default 'active' check (status in ('active', 'stale', 'revoke_requested', 'revoked_placeholder')),
  last_seen_at timestamptz not null default now(),
  revoke_requested_at timestamptz,
  revoked_by_admin_id uuid references public.users(id) on delete set null,
  revoke_reason text,
  created_at timestamptz not null default now(),
  unique(user_id, session_hash)
);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  device_session_id uuid references public.device_sessions(id) on delete set null,
  session_hash text,
  status text not null default 'active' check (status in ('active', 'logout_requested', 'revoked_placeholder')),
  last_seen_at timestamptz not null default now(),
  logout_all_requested_at timestamptz,
  revoked_by_admin_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.incident_evidence enable row level security;
alter table public.user_trust_snapshots enable row level security;
alter table public.flagged_behaviour_reviews enable row level security;
alter table public.analytics_events enable row level security;
alter table public.analytics_daily_metrics enable row level security;
alter table public.conversion_funnels enable row level security;
alter table public.cohort_metrics enable row level security;
alter table public.rate_limit_events enable row level security;
alter table public.suspicious_activity_events enable row level security;
alter table public.abuse_detection_signals enable row level security;
alter table public.blocked_devices enable row level security;
alter table public.blocked_emails enable row level security;
alter table public.blocked_phone_numbers enable row level security;
alter table public.device_sessions enable row level security;
alter table public.user_sessions enable row level security;

drop policy if exists "admins manage incident evidence" on public.incident_evidence;
create policy "admins manage incident evidence" on public.incident_evidence
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage trust snapshots" on public.user_trust_snapshots;
create policy "admins manage trust snapshots" on public.user_trust_snapshots
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage flagged behaviour reviews" on public.flagged_behaviour_reviews;
create policy "admins manage flagged behaviour reviews" on public.flagged_behaviour_reviews
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users create own analytics events" on public.analytics_events;
create policy "users create own analytics events" on public.analytics_events
for insert with check (actor_user_id = auth.uid() or actor_user_id is null);

drop policy if exists "admins read analytics events" on public.analytics_events;
create policy "admins read analytics events" on public.analytics_events
for select using (public.is_admin());

drop policy if exists "admins manage analytics daily metrics" on public.analytics_daily_metrics;
create policy "admins manage analytics daily metrics" on public.analytics_daily_metrics
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage conversion funnels" on public.conversion_funnels;
create policy "admins manage conversion funnels" on public.conversion_funnels
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage cohort metrics" on public.cohort_metrics;
create policy "admins manage cohort metrics" on public.cohort_metrics
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users record own rate limit events" on public.rate_limit_events;
create policy "users record own rate limit events" on public.rate_limit_events
for insert with check (user_id = auth.uid() or user_id is null);

drop policy if exists "admins manage rate limit events" on public.rate_limit_events;
create policy "admins manage rate limit events" on public.rate_limit_events
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users record own suspicious activity" on public.suspicious_activity_events;
create policy "users record own suspicious activity" on public.suspicious_activity_events
for insert with check (user_id = auth.uid() or user_id is null);

drop policy if exists "admins manage suspicious activity" on public.suspicious_activity_events;
create policy "admins manage suspicious activity" on public.suspicious_activity_events
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage abuse detection signals" on public.abuse_detection_signals;
create policy "admins manage abuse detection signals" on public.abuse_detection_signals
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage blocked devices" on public.blocked_devices;
create policy "admins manage blocked devices" on public.blocked_devices
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage blocked emails" on public.blocked_emails;
create policy "admins manage blocked emails" on public.blocked_emails
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage blocked phone numbers" on public.blocked_phone_numbers;
create policy "admins manage blocked phone numbers" on public.blocked_phone_numbers
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users manage own device sessions" on public.device_sessions;
create policy "users manage own device sessions" on public.device_sessions
for insert with check (user_id = auth.uid());

drop policy if exists "admins manage device sessions" on public.device_sessions;
create policy "admins manage device sessions" on public.device_sessions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users create own user sessions" on public.user_sessions;
create policy "users create own user sessions" on public.user_sessions
for insert with check (user_id = auth.uid());

drop policy if exists "admins manage user sessions" on public.user_sessions;
create policy "admins manage user sessions" on public.user_sessions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "active users insert applications" on public.membership_applications;
create policy "active users insert applications" on public.membership_applications
as restrictive for insert with check (public.current_user_can_write());

drop policy if exists "active users update applications" on public.membership_applications;
create policy "active users update applications" on public.membership_applications
as restrictive for update using (public.current_user_can_write()) with check (public.current_user_can_write());

drop policy if exists "active users insert profiles" on public.profiles;
create policy "active users insert profiles" on public.profiles
as restrictive for insert with check (public.current_user_can_write());

drop policy if exists "active users update profiles" on public.profiles;
create policy "active users update profiles" on public.profiles
as restrictive for update using (public.current_user_can_write()) with check (public.current_user_can_write());

drop policy if exists "active users insert messages" on public.messages;
create policy "active users insert messages" on public.messages
as restrictive for insert with check (public.current_user_can_write());

drop policy if exists "active users create reports" on public.safety_reports;
create policy "active users create reports" on public.safety_reports
as restrictive for insert with check (public.current_user_can_write());

drop policy if exists "active users create reviews" on public.reviews;
create policy "active users create reviews" on public.reviews
as restrictive for insert with check (public.current_user_can_write());

drop policy if exists "active users create concierge requests" on public.concierge_requests;
create policy "active users create concierge requests" on public.concierge_requests
as restrictive for insert with check (public.current_user_can_write());

drop policy if exists "active users create therapy sessions" on public.therapy_sessions;
create policy "active users create therapy sessions" on public.therapy_sessions
as restrictive for insert with check (public.current_user_can_write());

drop policy if exists "active users create experience rsvps" on public.experience_rsvps;
create policy "active users create experience rsvps" on public.experience_rsvps
as restrictive for insert with check (public.current_user_can_write());

drop policy if exists "active users create experience waitlists" on public.experience_waitlists;
create policy "active users create experience waitlists" on public.experience_waitlists
as restrictive for insert with check (public.current_user_can_write());

create index if not exists incidents_status_created_idx on public.incidents(status, created_at desc);
create index if not exists moderation_actions_target_created_idx on public.moderation_actions(target_user_id, created_at desc);
create index if not exists analytics_events_name_created_idx on public.analytics_events(event_name, created_at desc);
create index if not exists suspicious_activity_status_created_idx on public.suspicious_activity_events(status, created_at desc);
create index if not exists device_sessions_user_status_idx on public.device_sessions(user_id, status);
create index if not exists conversion_funnels_key_idx on public.conversion_funnels(funnel_key, step_order);
create index if not exists cohort_metrics_key_idx on public.cohort_metrics(cohort_key, metric_key);

insert into public.incidents (safety_report_id, status, private_summary, severity, ai_recommendation_summary)
select
  sr.id,
  sr.status,
  left(coalesce(sr.details, 'Safety report awaiting human review.'), 500),
  'standard',
  'Review only: assistant signals must not trigger account action without admin review.'
from public.safety_reports sr
left join public.incidents i on i.safety_report_id = sr.id
where i.id is null;

insert into public.incident_evidence (incident_id, safety_report_id, submitted_by_user_id, storage_path, evidence_summary)
select
  i.id,
  sr.id,
  sr.reporter_user_id,
  sr.evidence_placeholder,
  'Evidence placeholder from safety report.'
from public.safety_reports sr
join public.incidents i on i.safety_report_id = sr.id
left join public.incident_evidence ie on ie.safety_report_id = sr.id
where sr.evidence_placeholder is not null
  and ie.id is null;

create or replace function public.create_incident_for_safety_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  incident_uuid uuid;
begin
  insert into public.incidents (
    safety_report_id,
    status,
    private_summary,
    severity,
    ai_recommendation_summary,
    ai_recommendation_status
  )
  values (
    new.id,
    new.status,
    left(coalesce(new.details, 'Safety report awaiting human review.'), 500),
    'standard',
    'Review only: assistant signals must not trigger account action without admin review.',
    'review_required'
  )
  returning id into incident_uuid;

  if new.evidence_placeholder is not null then
    insert into public.incident_evidence (
      incident_id,
      safety_report_id,
      submitted_by_user_id,
      storage_path,
      evidence_summary
    )
    values (
      incident_uuid,
      new.id,
      new.reporter_user_id,
      new.evidence_placeholder,
      'Evidence placeholder from safety report.'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_safety_report_created on public.safety_reports;
create trigger on_safety_report_created
after insert on public.safety_reports
for each row execute function public.create_incident_for_safety_report();

create or replace function public.track_analytics_event(
  event_name text,
  source_area text default 'mobile',
  event_metadata jsonb default '{}'::jsonb,
  session_id_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_uuid uuid;
  resolved_role text;
  sanitized jsonb;
begin
  sanitized := coalesce(event_metadata, '{}'::jsonb)
    - 'email'
    - 'name'
    - 'legalName'
    - 'body'
    - 'details'
    - 'note'
    - 'notes'
    - 'privateNotes'
    - 'token'
    - 'storagePath'
    - 'evidence';

  select role::text into resolved_role
  from public.users
  where id = auth.uid();

  insert into public.analytics_events (
    actor_user_id,
    event_name,
    source_area,
    session_id_hash,
    user_role,
    metadata_sanitized
  )
  values (
    auth.uid(),
    event_name,
    coalesce(source_area, 'mobile'),
    session_id_hash,
    resolved_role,
    sanitized
  )
  returning id into event_uuid;

  return event_uuid;
end;
$$;

create or replace function public.admin_analytics_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  submitted_count integer;
  approved_count integer;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  select count(*) into submitted_count
  from public.membership_applications
  where status in ('submitted', 'under_review', 'approved', 'rejected', 'waitlisted', 'more_information');

  select count(*) into approved_count
  from public.membership_applications
  where status = 'approved';

  return jsonb_build_object(
    'generatedAt', now(),
    'events', jsonb_build_object(
      'total', (select count(*) from public.analytics_events),
      'last7Days', (select count(*) from public.analytics_events where created_at >= now() - interval '7 days'),
      'uniqueEventNames', (select count(distinct event_name) from public.analytics_events)
    ),
    'conversion', jsonb_build_object(
      'applicationsSubmitted', submitted_count,
      'applicationsApproved', approved_count,
      'approvalRate', case when submitted_count = 0 then 0 else round((approved_count::numeric / submitted_count::numeric) * 100, 1) end,
      'waitlisted', (select count(*) from public.membership_applications where status = 'waitlisted'),
      'rejected', (select count(*) from public.membership_applications where status = 'rejected')
    ),
    'engagement', jsonb_build_object(
      'matches', (select count(*) from public.matches),
      'messages', (select count(*) from public.messages),
      'videoDates', (select count(*) from public.video_dates),
      'reviews', (select count(*) from public.reviews)
    ),
    'operations', jsonb_build_object(
      'conciergeRequests', (select count(*) from public.concierge_requests),
      'therapySessions', (select count(*) from public.therapy_sessions),
      'experienceRsvps', (select count(*) from public.experience_rsvps),
      'experienceWaitlists', (select count(*) from public.experience_waitlists),
      'safetyReports', (select count(*) from public.safety_reports)
    ),
    'retention', jsonb_build_object(
      'placeholder', true,
      'cohortStatus', 'foundation_ready'
    ),
    'investor', jsonb_build_object(
      'approvedProfiles', (select count(*) from public.profiles where is_approved = true),
      'subscriptions', (select count(*) from public.subscriptions),
      'foundingMembers', (select count(*) from public.subscriptions where founding_member = true),
      'cacPlaceholder', 0,
      'ltvPlaceholder', 0,
      'subscriptionConversionPlaceholder', 0,
      'safetyIncidentRate', (select count(*) from public.safety_reports),
      'conciergeRequestRate', (select count(*) from public.concierge_requests)
    )
  );
end;
$$;
