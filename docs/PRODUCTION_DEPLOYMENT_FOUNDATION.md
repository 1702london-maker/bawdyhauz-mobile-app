# BAWDYHAUZ Production Deployment Foundation

This document defines the deployment path for local, staging and production environments.

## Environment Separation

Local:

- Developer machine.
- Expo Go or development build.
- `.env.local` with public Supabase values.
- Supabase project may be development or staging.

Staging:

- Separate Supabase project.
- Separate Resend test sender/domain where possible.
- EAS preview builds distributed internally.
- Test accounts and seeded data allowed.
- Used for App Store / Play Store review rehearsals.

Production:

- Separate Supabase project.
- Verified production sender domain.
- Production EAS builds only.
- Test accounts limited and documented.
- No seed data unless intentionally created as demo accounts.

## Environment Variables

Expo public variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_USE_SUPABASE=true
```

Supabase Edge Function secrets:

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Future server-side secrets:

- Stripe secret keys
- AI provider keys
- Push provider credentials
- monitoring provider tokens

Do not place server-side secrets in Expo or GitHub Actions logs.

## Supabase Deployment

For each environment:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
npx supabase functions deploy send-email
npx supabase functions deploy send-push
npx supabase functions deploy admin-actions
```

Before production, confirm:

- RLS enabled on all public tables.
- Storage policies applied.
- Edge Function secrets present.
- Admin test account works.
- Non-admin cannot read admin-only tables.

## EAS Build Profiles

Configured in `eas.json`:

- `development`: development client/internal.
- `preview`: internal testing.
- `production`: production submission.

Recommended commands:

```bash
npx eas build --profile preview --platform all
npx eas build --profile production --platform all
```

## GitHub CI Foundation

The workflow in `.github/workflows/ci.yml` runs:

- `npm ci`
- `npm run typecheck`
- `npx expo install --check`
- `npx expo-doctor`

Use it as a quality gate before merges and release tags.

## Monitoring Plan

App:

- Add future error tracking provider in a server-safe way.
- Track fatal app crashes and failed Supabase calls.
- Keep member-facing errors discreet.

Supabase:

- Monitor Auth logs.
- Monitor Postgres logs for RLS errors.
- Monitor Edge Function logs for email/push failures.
- Monitor Storage logs for rejected protected uploads.

Admin:

- `audit_logs` records sensitive admin actions.
- `moderation_actions` tracks review decisions.
- `analytics_events` tracks product events with sanitized metadata.

Incident response:

1. Identify affected system.
2. Pause risky feature if needed.
3. Review Supabase logs and audit logs.
4. Document timeline and mitigation.
5. Notify affected members only when appropriate.

## Backup And Rollback

Database:

- Enable Supabase automatic backups for production.
- Export schema before major migrations.
- Test migrations in staging first.
- Keep migration files immutable once pushed.

Migration rollback:

- Prefer forward-fix migrations.
- Avoid destructive rollback in production.
- For enum/table changes, create a corrective migration rather than editing history.

Release rollback:

- Keep GitHub release tags for each production build.
- Keep EAS build IDs in release notes.
- If mobile release fails, submit a hotfix build and pause rollout where store controls allow.

GitHub release strategy:

- Tag production releases as `vMAJOR.MINOR.PATCH`.
- Attach migration range, EAS build IDs, Supabase functions deployed, known issues and rollback notes.

## Production Readiness Gate

Before first public launch:

- App Store and Play Store metadata complete.
- Privacy/terms/safety pages live.
- Production Supabase project linked.
- Admin account secured.
- Test member approval path verified.
- Messaging, reports, upload and moderation tested with real accounts.
- Support channel available.
