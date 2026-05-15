-- Auth/profile bridge and member write policies required by the Expo app.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role, standing)
  values (new.id, new.email, 'member', 'clear')
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create policy "members create pending match requests" on public.matches
for insert with check (
  status = 'pending'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.id = profile_a_id
  )
);

create policy "members update own pending match requests" on public.matches
for update using (
  status = 'pending'
  and exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.id = profile_a_id
  )
) with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.id = profile_a_id
  )
);
