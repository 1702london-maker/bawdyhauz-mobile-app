-- Membership tiers and payment foundation. Real Stripe checkout stays server-side.

create type public.membership_tier as enum ('standard', 'black', 'elite', 'founding');
create type public.subscription_status as enum ('inactive', 'trialing', 'active', 'past_due', 'cancelled', 'expired');

create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  tier public.membership_tier not null unique,
  name text not null,
  description text,
  price_placeholder text,
  stripe_price_id text,
  benefits text[] not null default '{}',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid references public.membership_plans(id) on delete set null,
  tier public.membership_tier not null default 'standard',
  status public.subscription_status not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  founding_member boolean not null default false,
  billing_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  stripe_event_id text unique,
  event_type text not null,
  status text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  stripe_invoice_id text unique,
  amount_placeholder text,
  status text,
  hosted_invoice_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.entitlement_rules (
  id uuid primary key default gen_random_uuid(),
  tier public.membership_tier not null,
  entitlement_key text not null,
  enabled boolean not null default true,
  description text,
  created_at timestamptz not null default now(),
  unique(tier, entitlement_key)
);

alter table public.membership_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;
alter table public.invoices enable row level security;
alter table public.entitlement_rules enable row level security;

create policy "members read active plans" on public.membership_plans for select using (active = true or public.is_admin());
create policy "admins manage plans" on public.membership_plans for all using (public.is_admin()) with check (public.is_admin());

create policy "users read own subscription" on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());
create policy "admins manage subscriptions" on public.subscriptions for all using (public.is_admin()) with check (public.is_admin());

create policy "admins manage payment events" on public.payment_events for all using (public.is_admin()) with check (public.is_admin());
create policy "users read own invoices" on public.invoices for select using (user_id = auth.uid() or public.is_admin());
create policy "admins manage invoices" on public.invoices for all using (public.is_admin()) with check (public.is_admin());

create policy "members read entitlement rules" on public.entitlement_rules for select using (true);
create policy "admins manage entitlement rules" on public.entitlement_rules for all using (public.is_admin()) with check (public.is_admin());

insert into public.membership_plans (tier, name, description, price_placeholder, benefits, sort_order)
values
  ('standard', 'Standard', 'Approved member access to the BAWDYHAUZ private ecosystem.', 'TBC', array['Curated matchmaking access', 'Private member profile', 'Wellness resources', 'Safety review system'], 1),
  ('black', 'Black', 'Priority discovery and concierge-supported introductions.', 'TBC', array['Priority review', 'Premium discovery', 'Concierge date planning', 'Therapist and wellness access'], 2),
  ('elite', 'Elite', 'Elevated matchmaking, private experiences and concierge priority.', 'TBC', array['Elevated visibility', 'Private experiences', 'Concierge priority', 'Exclusive member gatherings'], 3),
  ('founding', 'Founding Member', 'Lifetime early-access status placeholder for founding members.', 'Lifetime placeholder', array['Founding member status', 'Early-access privileges', 'Priority concierge review', 'Exclusive member experiences'], 4)
on conflict (tier) do update set
  benefits = excluded.benefits,
  description = excluded.description,
  name = excluded.name,
  sort_order = excluded.sort_order;

insert into public.entitlement_rules (tier, entitlement_key, description)
values
  ('standard', 'approved_member_access', 'Approved member area access'),
  ('standard', 'curated_matchmaking', 'Curated matchmaking access'),
  ('black', 'premium_discovery', 'Premium discovery and elevated filtering'),
  ('black', 'concierge_priority', 'Concierge date planning priority'),
  ('elite', 'private_experiences', 'Private experience access and priority RSVP'),
  ('elite', 'elevated_matchmaking', 'Elevated matchmaking visibility'),
  ('founding', 'founding_lifetime', 'Founding lifetime/early-access status')
on conflict (tier, entitlement_key) do update set
  description = excluded.description,
  enabled = true;
