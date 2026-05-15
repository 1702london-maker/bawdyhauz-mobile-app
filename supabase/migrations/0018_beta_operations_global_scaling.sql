-- Phase 18-20: beta launch infrastructure, operational team tools, and global scaling foundations.

create table if not exists public.beta_cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'planned' check (status in ('planned', 'inviting', 'active', 'closed')),
  launch_notes text,
  target_member_count integer not null default 0,
  created_by_admin_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  status text not null default 'available' check (status in ('available', 'sent', 'claimed', 'expired', 'revoked')),
  cohort_id uuid references public.beta_cohorts(id) on delete set null,
  assigned_email text,
  assigned_user_id uuid references public.users(id) on delete set null,
  usage_count integer not null default 0,
  max_uses integer not null default 1,
  expires_at timestamptz,
  created_by_admin_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.beta_cohort_members (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references public.beta_cohorts(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'active', 'paused', 'completed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  unique(cohort_id, user_id)
);

alter table public.website_waitlist
  add column if not exists priority_notes text,
  add column if not exists referral_source text,
  add column if not exists admin_status text not null default 'new' check (admin_status in ('new', 'reviewing', 'invited', 'approved', 'declined', 'archived')),
  add column if not exists assigned_admin_id uuid references public.users(id) on delete set null;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid references public.users(id) on delete set null,
  referred_email text,
  referred_user_id uuid references public.users(id) on delete set null,
  referral_code text not null,
  status text not null default 'shared' check (status in ('shared', 'applied', 'approved', 'declined', 'expired')),
  created_at timestamptz not null default now()
);

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  feedback_type text not null default 'experience' check (feedback_type in ('experience', 'bug', 'conduct', 'idea')),
  sentiment text not null default 'neutral' check (sentiment in ('low', 'neutral', 'strong')),
  title text,
  details text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'archived')),
  priority text not null default 'standard' check (priority in ('low', 'standard', 'high')),
  assigned_admin_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.concierge_member_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  concierge_request_id uuid references public.concierge_requests(id) on delete set null,
  note text not null,
  follow_up_status text not null default 'open' check (follow_up_status in ('open', 'scheduled', 'completed', 'paused')),
  booking_status text not null default 'reviewing',
  created_by_admin_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.therapists
  add column if not exists availability_notes text,
  add column if not exists admin_notes text,
  add column if not exists status text not null default 'active' check (status in ('draft', 'active', 'paused', 'archived'));

alter table public.venues
  add column if not exists capacity integer,
  add column if not exists privacy_level text not null default 'private' check (privacy_level in ('discreet', 'private', 'exclusive')),
  add column if not exists booking_contact text,
  add column if not exists admin_notes text,
  add column if not exists status text not null default 'active' check (status in ('draft', 'active', 'paused', 'archived'));

alter table public.private_experiences
  add column if not exists status text not null default 'draft' check (status in ('draft', 'reviewing', 'published', 'closed', 'archived')),
  add column if not exists attendance_status text not null default 'not_started' check (attendance_status in ('not_started', 'checking_in', 'completed')),
  add column if not exists admin_notes text;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  issue_type text not null default 'general',
  subject text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'waiting_member', 'resolved', 'closed')),
  priority text not null default 'standard' check (priority in ('low', 'standard', 'high', 'urgent')),
  assigned_admin_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket_notes (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.support_tickets(id) on delete cascade,
  admin_user_id uuid references public.users(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.supported_cities (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  country text not null,
  region text,
  launch_status text not null default 'planned' check (launch_status in ('planned', 'private_beta', 'active', 'paused')),
  concierge_coverage text not null default 'planned' check (concierge_coverage in ('none', 'planned', 'limited', 'full')),
  therapist_coverage text not null default 'planned' check (therapist_coverage in ('none', 'planned', 'limited', 'full')),
  venue_coverage text not null default 'planned' check (venue_coverage in ('none', 'planned', 'limited', 'full')),
  timezone text not null default 'Europe/London',
  currency_code text not null default 'GBP',
  locale_code text not null default 'en-GB',
  launch_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(city, country)
);

create table if not exists public.locale_copy_registry (
  id uuid primary key default gen_random_uuid(),
  locale_code text not null,
  copy_key text not null,
  copy_value text not null,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(locale_code, copy_key)
);

alter table public.beta_cohorts enable row level security;
alter table public.beta_invites enable row level security;
alter table public.beta_cohort_members enable row level security;
alter table public.referrals enable row level security;
alter table public.beta_feedback enable row level security;
alter table public.concierge_member_notes enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_notes enable row level security;
alter table public.supported_cities enable row level security;
alter table public.locale_copy_registry enable row level security;

drop policy if exists "admins manage beta cohorts" on public.beta_cohorts;
create policy "admins manage beta cohorts" on public.beta_cohorts
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage beta invites" on public.beta_invites;
create policy "admins manage beta invites" on public.beta_invites
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users read assigned beta invites" on public.beta_invites;
create policy "users read assigned beta invites" on public.beta_invites
for select using (assigned_user_id = auth.uid() or public.is_admin());

drop policy if exists "admins manage beta cohort members" on public.beta_cohort_members;
create policy "admins manage beta cohort members" on public.beta_cohort_members
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users read own beta cohort membership" on public.beta_cohort_members;
create policy "users read own beta cohort membership" on public.beta_cohort_members
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "users create own referrals" on public.referrals;
create policy "users create own referrals" on public.referrals
for insert with check (referrer_user_id = auth.uid());

drop policy if exists "users read own referrals" on public.referrals;
create policy "users read own referrals" on public.referrals
for select using (referrer_user_id = auth.uid() or referred_user_id = auth.uid() or public.is_admin());

drop policy if exists "admins manage referrals" on public.referrals;
create policy "admins manage referrals" on public.referrals
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users create own beta feedback" on public.beta_feedback;
create policy "users create own beta feedback" on public.beta_feedback
for insert with check (user_id = auth.uid());

drop policy if exists "users read own beta feedback" on public.beta_feedback;
create policy "users read own beta feedback" on public.beta_feedback
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admins manage beta feedback" on public.beta_feedback;
create policy "admins manage beta feedback" on public.beta_feedback
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage concierge member notes" on public.concierge_member_notes;
create policy "admins manage concierge member notes" on public.concierge_member_notes
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage support tickets" on public.support_tickets;
create policy "admins manage support tickets" on public.support_tickets
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users create own support tickets" on public.support_tickets;
create policy "users create own support tickets" on public.support_tickets
for insert with check (user_id = auth.uid());

drop policy if exists "users read own support tickets" on public.support_tickets;
create policy "users read own support tickets" on public.support_tickets
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admins manage support ticket notes" on public.support_ticket_notes;
create policy "admins manage support ticket notes" on public.support_ticket_notes
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "approved users read supported cities" on public.supported_cities;
create policy "approved users read supported cities" on public.supported_cities
for select using (
  launch_status in ('private_beta', 'active')
  or public.is_admin()
);

drop policy if exists "admins manage supported cities" on public.supported_cities;
create policy "admins manage supported cities" on public.supported_cities
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage locale copy registry" on public.locale_copy_registry;
create policy "admins manage locale copy registry" on public.locale_copy_registry
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "members read published locale copy" on public.locale_copy_registry;
create policy "members read published locale copy" on public.locale_copy_registry
for select using (status = 'published' or public.is_admin());

create index if not exists beta_invites_code_idx on public.beta_invites(invite_code);
create index if not exists beta_feedback_status_created_idx on public.beta_feedback(status, created_at desc);
create index if not exists support_tickets_status_priority_idx on public.support_tickets(status, priority, created_at desc);
create index if not exists supported_cities_launch_idx on public.supported_cities(launch_status, city);
create index if not exists venue_city_status_idx on public.venues(city, status);
create index if not exists therapist_status_idx on public.therapists(status);

insert into public.beta_cohorts (name, status, launch_notes, target_member_count)
values
  ('London Private Beta', 'active', 'Founding member cohort for concierge, matchmaking and wellness QA.', 50),
  ('International Waitlist Review', 'planned', 'High-intent applicants outside first launch cities.', 100)
on conflict do nothing;

insert into public.supported_cities (
  city,
  country,
  region,
  launch_status,
  concierge_coverage,
  therapist_coverage,
  venue_coverage,
  timezone,
  currency_code,
  locale_code,
  launch_notes
)
values
  ('London', 'United Kingdom', 'Europe', 'private_beta', 'limited', 'limited', 'limited', 'Europe/London', 'GBP', 'en-GB', 'First private beta city.'),
  ('Manchester', 'United Kingdom', 'Europe', 'planned', 'planned', 'planned', 'planned', 'Europe/London', 'GBP', 'en-GB', 'North England expansion candidate.'),
  ('Paris', 'France', 'Europe', 'planned', 'planned', 'planned', 'planned', 'Europe/Paris', 'EUR', 'fr-FR', 'Luxury social and cultural partner review.'),
  ('Dubai', 'United Arab Emirates', 'Middle East', 'planned', 'planned', 'planned', 'planned', 'Asia/Dubai', 'AED', 'en-AE', 'International private member expansion candidate.'),
  ('New York', 'United States', 'North America', 'planned', 'planned', 'planned', 'planned', 'America/New_York', 'USD', 'en-US', 'Future enterprise and investor market.')
on conflict (city, country) do update set
  launch_status = excluded.launch_status,
  concierge_coverage = excluded.concierge_coverage,
  therapist_coverage = excluded.therapist_coverage,
  venue_coverage = excluded.venue_coverage,
  launch_notes = excluded.launch_notes,
  updated_at = now();
