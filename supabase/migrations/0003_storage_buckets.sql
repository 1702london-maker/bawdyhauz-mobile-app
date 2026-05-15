-- BAWDYHAUZ storage buckets and storage object policies.
-- Verification documents and report evidence are private to the uploader and admins.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-photos', 'profile-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('private-gallery', 'private-gallery', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('verification-documents', 'verification-documents', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('report-evidence', 'report-evidence', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('experience-images', 'experience-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "public reads public bawdyhauz media" on storage.objects
for select using (bucket_id in ('profile-photos', 'experience-images'));

create policy "members upload own profile photos" on storage.objects
for insert with check (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "members manage own private gallery" on storage.objects
for all using (
  bucket_id = 'private-gallery'
  and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'private-gallery'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "members upload own verification documents" on storage.objects
for insert with check (
  bucket_id = 'verification-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "members upload own report evidence" on storage.objects
for insert with check (
  bucket_id = 'report-evidence'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "admins manage protected bawdyhauz storage" on storage.objects
for all using (public.is_admin()) with check (public.is_admin());

create policy "admins upload experience images" on storage.objects
for insert with check (
  bucket_id = 'experience-images'
  and public.is_admin()
);
