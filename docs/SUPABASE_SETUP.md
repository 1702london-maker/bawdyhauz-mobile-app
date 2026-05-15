# BAWDYHAUZ Supabase Setup

This app uses the Supabase publishable/anon key in Expo only. Never place a service-role key in `.env`, `app.json`, source code, or any file committed to the mobile app.

## 1. Create The Project

1. Create a Supabase project.
2. In Project Settings > API, copy:
   - Project URL
   - Publishable/anon key
3. Copy `.env.example` to `.env.local`.
4. Paste:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
EXPO_PUBLIC_USE_SUPABASE=true
```

Keep `EXPO_PUBLIC_USE_SUPABASE=false` or omit keys to run the app in mock mode.

## 2. Run Migrations

Install and authenticate the Supabase CLI, then link the project:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

Migrations included:

- `supabase/migrations/0001_initial_schema.sql`
- `supabase/migrations/0002_rls_policies.sql`
- `supabase/migrations/0003_storage_buckets.sql`
- `supabase/migrations/0004_auth_and_member_write_policies.sql`
- `supabase/migrations/0005_live_seed_public_content.sql`
- `supabase/migrations/0006_secure_approval_gating_policies.sql`
- `supabase/migrations/0007_auth_status_test_users.sql`
- `supabase/migrations/0008_auth_test_user_identities.sql`
- `supabase/migrations/0009_cleanup_manual_auth_test_users.sql`
- `supabase/migrations/0010_test_account_profile_upsert_fix.sql`
- `supabase/migrations/0011_admin_approval_operations.sql`
- `supabase/migrations/0012_membership_tiers_and_payments.sql`
- `supabase/migrations/0013_email_and_push_notifications.sql`
- `supabase/migrations/0014_messaging_video_concierge_operations.sql`
- `supabase/migrations/0015_email_push_media_storage.sql`
- `supabase/migrations/0016_profile_ai_website_unification.sql`

## 3. Seed Test Data

For local development:

```bash
supabase db reset
```

For a linked remote project, apply `supabase/seed.sql` from the SQL editor only in a non-production project. `supabase db push` applies migrations but does not automatically apply seed data to a remote project.

Seed login placeholders:

- `member@bawdyhauz.test`
- `admin@bawdyhauz.test`

Password:

- `Bawdyhauz123!`

## 4. Auth Testing

The app can run without a formal sign-in UI while the backend foundation is being connected. If Supabase is enabled, write flows call `signInAnonymously()` as a temporary bridge. Enable anonymous sign-ins in Supabase Auth if you want to test application submissions before the real sign-in screen exists.

In the Supabase dashboard:

1. Open Authentication > Sign In / Providers.
2. Enable Anonymous sign-ins for temporary integration testing.
3. Keep it disabled for production if final membership login is not anonymous.

Later live auth should replace this with the final BAWDYHAUZ membership login flow.

If anonymous sign-ins stay disabled, create a real test member through Supabase Auth and sign in through the future app auth screen before testing write flows.

## 5. Admin And Service Role Safety

The mobile app must only use:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Admin operations that require service-role access should live in Supabase Edge Functions or another server-only backend. Place the service-role key only in Supabase function secrets:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Never expose that value to Expo.

This repository includes a server-only scaffold at `supabase/functions/admin-actions/index.ts`.
Deploy it with:

```bash
supabase functions deploy admin-actions
```

## 6. Test Checklist

Mock mode:

```bash
EXPO_PUBLIC_USE_SUPABASE=false
npm start
```

Connected mode:

```bash
EXPO_PUBLIC_USE_SUPABASE=true
npm start
```

Verify:

- membership application submission writes to `membership_applications`
- verification placeholder writes to `verification_checks`
- discover loads approved/public-safe `profiles`
- matches read from `matches`
- messages write/read from `messages`
- therapist bookings write to `therapy_sessions`
- experiences load from `private_experiences`
- RSVP writes to `experience_rsvps`
- waitlist writes to `experience_waitlists`
- safety reports write to `safety_reports`
- admin queues read protected data for admin users only

If a connected flow falls back to mock data, check RLS, the current authenticated user, and whether anonymous auth is enabled.
