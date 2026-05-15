-- Email delivery logs, push readiness, and media storage metadata.

alter table public.email_logs
  add column if not exists event_type text,
  add column if not exists recipient text,
  add column if not exists sent_at timestamptz,
  add column if not exists provider text default 'resend';

create unique index if not exists email_logs_notification_event_unique
on public.email_logs(notification_event_id)
where notification_event_id is not null;

alter table public.profiles
  add column if not exists primary_photo_path text,
  add column if not exists primary_photo_public_url text;

create table if not exists public.profile_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  bucket_id text not null,
  storage_path text not null,
  media_type text not null default 'profile_photo',
  is_private boolean not null default false,
  is_public_safe boolean not null default false,
  created_at timestamptz not null default now(),
  unique(bucket_id, storage_path)
);

create table if not exists public.experience_media (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid references public.private_experiences(id) on delete cascade,
  bucket_id text not null default 'experience-images',
  storage_path text not null,
  is_public_safe boolean not null default false,
  created_at timestamptz not null default now(),
  unique(bucket_id, storage_path)
);

alter table public.profile_media enable row level security;
alter table public.experience_media enable row level security;

create policy "users manage own profile media" on public.profile_media
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "members read public safe profile media" on public.profile_media
for select using (is_public_safe = true and is_private = false);

create policy "admins manage profile media" on public.profile_media
for all using (public.is_admin()) with check (public.is_admin());

create policy "members read public safe experience media" on public.experience_media
for select using (is_public_safe = true);

create policy "admins manage experience media" on public.experience_media
for all using (public.is_admin()) with check (public.is_admin());

create policy "members read own private gallery files" on storage.objects
for select using (
  bucket_id = 'private-gallery'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "members read own verification documents" on storage.objects
for select using (
  bucket_id = 'verification-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "members read own report evidence" on storage.objects
for select using (
  bucket_id = 'report-evidence'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "members update own profile photos" on storage.objects
for update using (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "members delete own profile photos" on storage.objects
for delete using (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
