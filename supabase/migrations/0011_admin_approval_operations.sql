-- Admin approval operations need server-side permission to update account standing.

drop policy if exists "admins update users" on public.users;
create policy "admins update users" on public.users
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins insert audit logs" on public.audit_logs;
create policy "admins insert audit logs" on public.audit_logs
for insert with check (public.is_admin());
