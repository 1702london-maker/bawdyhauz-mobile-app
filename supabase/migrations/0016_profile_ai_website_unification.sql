-- Profile intelligence, AI review foundation, and website/app shared backend tables.

alter table public.profiles
  add column if not exists availability_notes text,
  add column if not exists wellness_preferences text[] default '{}'::text[],
  add column if not exists private_experience_interests text[] default '{}'::text[],
  add column if not exists completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  add column if not exists visibility_weight integer not null default 100,
  add column if not exists is_featured boolean not null default false,
  add column if not exists discover_hidden boolean not null default false,
  add column if not exists admin_visibility_notes text;

create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  request_type text not null,
  input_summary text,
  output_summary text,
  status text not null default 'placeholder',
  admin_reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  ai_request_id uuid references public.ai_requests(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  recommendation_type text not null,
  title text not null,
  summary text,
  status text not null default 'review_required',
  admin_reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_review_flags (
  id uuid primary key default gen_random_uuid(),
  ai_request_id uuid references public.ai_requests(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  flag_type text not null,
  severity text not null default 'review',
  summary text,
  admin_reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.public_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  city text,
  event_date text,
  summary text,
  app_experience_id uuid references public.private_experiences(id) on delete set null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.editorial_content (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content_type text not null,
  excerpt text,
  body text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.landing_page_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  city text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.website_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  city text,
  intention text,
  status text not null default 'received',
  created_at timestamptz not null default now()
);

create table if not exists public.shop_referrals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  source text,
  referral_url text,
  created_at timestamptz not null default now()
);

alter table public.ai_requests enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_review_flags enable row level security;
alter table public.public_events enable row level security;
alter table public.editorial_content enable row level security;
alter table public.landing_page_leads enable row level security;
alter table public.website_waitlist enable row level security;
alter table public.shop_referrals enable row level security;

create policy "users read own ai requests" on public.ai_requests
for select using (user_id = auth.uid() or public.is_admin());
create policy "users create own ai requests" on public.ai_requests
for insert with check (user_id = auth.uid());
create policy "admins manage ai requests" on public.ai_requests
for all using (public.is_admin()) with check (public.is_admin());

create policy "users read own ai recommendations" on public.ai_recommendations
for select using (user_id = auth.uid() or public.is_admin());
create policy "admins manage ai recommendations" on public.ai_recommendations
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage ai review flags" on public.ai_review_flags
for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads published events" on public.public_events
for select using (is_public = true or public.is_admin());
create policy "admins manage public events" on public.public_events
for all using (public.is_admin()) with check (public.is_admin());

create policy "public reads published editorial" on public.editorial_content
for select using (is_published = true or public.is_admin());
create policy "admins manage editorial" on public.editorial_content
for all using (public.is_admin()) with check (public.is_admin());

create policy "public creates landing leads" on public.landing_page_leads
for insert with check (true);
create policy "admins manage landing leads" on public.landing_page_leads
for all using (public.is_admin()) with check (public.is_admin());

create policy "public creates website waitlist" on public.website_waitlist
for insert with check (true);
create policy "admins manage website waitlist" on public.website_waitlist
for all using (public.is_admin()) with check (public.is_admin());

create policy "users create own shop referrals" on public.shop_referrals
for insert with check (user_id = auth.uid() or user_id is null);
create policy "admins manage shop referrals" on public.shop_referrals
for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.discover_profiles()
returns table (
  id uuid,
  display_name text,
  city text,
  bio text,
  intentions text[],
  interests text[],
  lifestyle_notes text,
  preferred_introduction_city text,
  is_approved boolean,
  completion_percentage integer,
  visibility_weight integer,
  is_featured boolean,
  primary_photo_public_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    p.city,
    p.bio,
    p.intentions,
    p.interests,
    p.lifestyle_notes,
    p.preferred_introduction_city,
    p.is_approved,
    p.completion_percentage,
    p.visibility_weight,
    p.is_featured,
    p.primary_photo_public_url
  from public.profiles p
  join public.users u on u.id = p.user_id
  where p.is_approved = true
    and p.is_public_safe = true
    and p.discover_hidden = false
    and u.standing not in ('restricted', 'suspended', 'banned')
  order by p.is_featured desc, p.visibility_weight desc, p.created_at desc;
$$;
