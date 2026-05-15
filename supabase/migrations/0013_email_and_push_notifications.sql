-- Email and push notification foundation for BAWDYHAUZ.

create type public.notification_channel as enum ('email', 'push', 'in_app');
create type public.notification_delivery_status as enum ('queued', 'skipped', 'sent', 'failed');

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_type text not null,
  channel public.notification_channel not null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_delivery_status not null default 'queued',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  notification_event_id uuid references public.notification_events(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  to_email text,
  subject text not null,
  template_key text not null,
  provider_message_id text,
  status public.notification_delivery_status not null default 'queued',
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  expo_push_token text not null,
  device_label text,
  platform text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, expo_push_token)
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  matches boolean not null default true,
  messages boolean not null default true,
  video_dates boolean not null default true,
  concierge_updates boolean not null default true,
  therapist_bookings boolean not null default true,
  private_experiences boolean not null default true,
  safety_admin_notices boolean not null default true,
  marketing_offers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_events enable row level security;
alter table public.email_logs enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_preferences enable row level security;

create policy "users read own notification events" on public.notification_events
for select using (user_id = auth.uid() or public.is_admin());
create policy "users create own notification events" on public.notification_events
for insert with check (user_id = auth.uid());
create policy "admins manage notification events" on public.notification_events
for all using (public.is_admin()) with check (public.is_admin());

create policy "users read own email logs" on public.email_logs
for select using (user_id = auth.uid() or public.is_admin());
create policy "admins manage email logs" on public.email_logs
for all using (public.is_admin()) with check (public.is_admin());

create policy "users manage own push tokens" on public.push_tokens
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins read push tokens" on public.push_tokens
for select using (public.is_admin());

create policy "users manage own notification preferences" on public.notification_preferences
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins read notification preferences" on public.notification_preferences
for select using (public.is_admin());
