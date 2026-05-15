# CI/CD Checklist

## Pull Request Checks

Run locally and in GitHub Actions:

```bash
npm ci
npm run typecheck
npx expo install --check
npx expo-doctor
```

## Manual Release Checks

- Confirm `.env.local` is not committed.
- Confirm Expo public env values are present in EAS.
- Confirm Supabase migrations have been pushed to staging.
- Confirm Edge Functions have been deployed to staging.
- Confirm admin account can load admin dashboard.
- Confirm non-admin account cannot access admin routes.
- Confirm application, approval, discover, messaging, safety and upload flows still work.

## Release Branching

Recommended pattern:

- `main`: production-ready.
- `staging`: pre-production validation.
- `codex/*`: implementation branches.

## Production Release Notes Template

```text
Version:
Date:
EAS iOS build:
EAS Android build:
Supabase migration range:
Edge Functions deployed:
Member-facing changes:
Admin changes:
Security notes:
Known issues:
Rollback plan:
```

## Dependency Policy

- Prefer `npx expo install` for Expo-managed packages.
- Run `npx expo install --check` after dependency changes.
- Avoid force-upgrading dependencies close to submission.
