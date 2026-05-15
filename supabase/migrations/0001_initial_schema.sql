-- BAWDYHAUZ initial Supabase schema foundation.
-- This is a planning migration for the live connection phase. Review before applying.

create extension if not exists pgcrypto;

create type public.user_role as enum ('member', 'admin');
create type public.user_standing as enum ('clear', 'flagged', 'restricted', 'suspended', 'banned');
create type public.application_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'waitlisted', 'more_information');
create type public.verification_status as enum ('pending', 'submitted', 'id_reviewed', 'selfie_reviewed', 'verified', 'failed', 'manual_hold');
create type public.match_status as enum ('pending', 'mutual', 'archived', 'blocked', 'closed');
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type public.incident_status as enum ('report_received', 'under_review', 'action_taken', 'closed');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role public.user_role not null default 'member',
  standing public.user_standing not null default 'clear',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  display_name text not null,
  city text,
  bio text,
  intentions text[],
  interests text[],
  lifestyle_notes text,
  preferred_introduction_city text,
  is_approved boolean not null default false,
  is_public_safe boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status public.application_status not null default 'draft',
  legal_name text,
  city text,
  age_confirmed boolean not null default false,
  intentions text[],
  lifestyle_interests text[],
  private_notes text,
  social_links jsonb not null default '{}'::jsonb,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status public.verification_status not null default 'pending',
  id_document_placeholder text,
  selfie_placeholder text,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  profile_a_id uuid not null references public.profiles(id) on delete cascade,
  profile_b_id uuid not null references public.profiles(id) on delete cascade,
  status public.match_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_a_id, profile_b_id)
);

create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_user_id uuid not null references public.users(id) on delete cascade,
  body text,
  media_placeholder text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.video_dates (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  status public.booking_status not null default 'pending',
  scheduled_for timestamptz,
  duration_minutes integer check (duration_minutes in (30, 60)),
  post_video_decision text,
  created_at timestamptz not null default now()
);

create table public.concierge_requests (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete set null,
  requester_user_id uuid references public.users(id) on delete set null,
  city text,
  atmosphere text,
  ideal_date_time text,
  status public.booking_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  category text,
  atmosphere text,
  private_notes text,
  created_at timestamptz not null default now()
);

create table public.date_bookings (
  id uuid primary key default gen_random_uuid(),
  concierge_request_id uuid references public.concierge_requests(id) on delete set null,
  venue_id uuid references public.venues(id) on delete set null,
  status public.booking_status not null default 'pending',
  scheduled_for timestamptz,
  reservation_placeholder text,
  created_at timestamptz not null default now()
);

create table public.therapists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  bio text,
  specialisms text[],
  qualifications_placeholder text[],
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.therapy_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  therapist_id uuid references public.therapists(id) on delete set null,
  session_type text,
  preferred_time text,
  private_notes text,
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.private_experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  city text,
  event_date text,
  event_time text,
  access_type text,
  description text,
  venue_style_placeholder text,
  dress_code text,
  guest_tone text,
  created_at timestamptz not null default now()
);

create table public.experience_rsvps (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.private_experiences(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'requested',
  guest_preference_notes text,
  accessibility_notes text,
  created_at timestamptz not null default now()
);

create table public.experience_waitlists (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.private_experiences(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'waitlisted',
  preferred_city text,
  private_notes text,
  created_at timestamptz not null default now(),
  unique(experience_id, user_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete set null,
  reviewer_user_id uuid references public.users(id) on delete set null,
  respect_rating integer check (respect_rating between 1 and 5),
  communication_rating integer check (communication_rating between 1 and 5),
  safety_rating integer check (safety_rating between 1 and 5),
  chemistry_rating integer check (chemistry_rating between 1 and 5),
  overall_rating integer check (overall_rating between 1 and 5),
  written_review text,
  next_step text,
  created_at timestamptz not null default now()
);

create table public.safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references public.users(id) on delete set null,
  target_user_id uuid references public.users(id) on delete set null,
  reason text not null,
  details text,
  evidence_placeholder text,
  created_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  safety_report_id uuid references public.safety_reports(id) on delete set null,
  status public.incident_status not null default 'report_received',
  assigned_admin_id uuid references public.users(id) on delete set null,
  private_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete set null,
  admin_user_id uuid references public.users(id) on delete set null,
  target_user_id uuid references public.users(id) on delete set null,
  action text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.users(id) on delete set null,
  target_user_id uuid references public.users(id) on delete set null,
  entity_type text,
  entity_id uuid,
  note text not null,
  follow_up_needed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
