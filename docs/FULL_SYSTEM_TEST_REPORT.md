# BAWDYHAUZ Full System Test Report

Date: 2026-05-15

## Scope

This report covers the current Expo app and Supabase-connected architecture before the Claude UI cleanup pass.

Test target:

- Website as public gateway
- Mobile app as private members ecosystem
- Supabase as shared backend

## Repository Inspection

Confirmed structure:

- `src/navigation` app routing and auth-gated member shell
- `src/screens` onboarding, application, verification, member, admin and operations screens
- `src/services` Supabase services for auth, applications, profiles, matches, messages, concierge, wellness, experiences, reports, analytics, beta and operations
- `supabase/migrations` migrations `0001` through `0018`
- `supabase/functions` email, push, admin action and payment placeholder functions
- `docs` setup, security, store, deployment, investor and operations documentation

Git limitation:

- The Codex shell could not find a `git` executable, so it could not pull from GitHub or commit directly.
- Work continued from the current local workspace.

## Architecture Confirmation

Confirmed by source inspection:

- Supabase Auth and session persistence exist.
- Approval gating exists through `getAccountStatus` and `getAuthGateDestination`.
- Admin approval operations exist in `AdminDashboardScreen` and `adminActions`.
- Messaging uses Supabase threads/messages with realtime subscription hooks.
- Video introduction scheduling uses `video_dates`.
- Concierge requests and venue options use Supabase service methods.
- Therapist bookings use `therapy_sessions`.
- Private experiences use `private_experiences`, `experience_rsvps` and `experience_waitlists`.
- Safety reports, incidents, moderation actions and audit logs exist.
- Analytics, beta launch tools, operations tools and global scaling foundations exist.
- Shop remains external through `https://www.bawdyhauz.com/shop`.

## Website To App Test Path

| Step | Expected Result | Status |
| --- | --- | --- |
| Website public application source | Public website can insert `website_waitlist` lead | Prepared |
| Admin approval queue | Queue now combines `membership_applications` and `website_waitlist` leads | Prepared |
| Admin action on website lead | Updates `website_waitlist.status`, `admin_status`, notes and audit logs | Prepared |
| App login with same email | Supabase Auth routes by shared account/profile/application state | Existing |
| Deep link from email/website | `bawdyhauz://login`, `status`, `apply`, `home`, `beta` resolve in app | Prepared |

## Member Ecosystem Test Path

| Area | Expected Result | Status |
| --- | --- | --- |
| Auth/login | Email login uses Supabase Auth | Existing |
| Status routing | Pending/approved/rejected/waitlisted/restricted/banned/admin route correctly | Existing |
| Discover | Approved/public-safe profiles load through profile service | Existing |
| Match | Interest and approved match foundations exist | Existing |
| Messaging | Thread send/load/realtime foundation exists | Existing |
| Video intro | 3-hour threshold and scheduling state exist | Existing |
| Concierge request | Request submission and venue selection foundation exist | Existing |
| Therapist booking | Session request foundation exists | Existing |
| Experience RSVP | RSVP and waitlist foundation exists | Existing |
| Safety report | Report and evidence upload foundation exists | Existing |
| Admin protection | Admin services require `requireAdminUser` | Existing |
| RLS | Policies protect own/admin data across core tables | Existing |

## Commands Run

Run during this pass:

```powershell
where.exe git
Get-ChildItem -Force -Name
rg --files
npm run typecheck
npx expo install --check
npx expo-doctor
npx expo export --platform android --output-dir dist-check-website-flow
```

## Results

Implemented during this pass:

- Website-to-app flow documentation.
- Website lead service shape for public forms.
- Admin queue support for website leads.
- Deep-link resolver and navigator handling.
- App scheme and HTTPS app-link foundation in Expo config.
- TypeScript passed.
- Expo dependency check passed.
- Expo Doctor passed, 17/17 checks.
- Android export smoke check passed.

## Remaining Manual Production Checks

Before launch:

- Push migration `0018` if not already pushed.
- Add Apple App Site Association and Android Asset Links files to the website.
- Confirm final App Store and Play Store URLs.
- Run real two-device messaging test.
- Run real admin approval test against staging Supabase.
- Confirm non-admin RLS blocks admin queues in staging.
- Confirm website form writes to the intended Supabase environment.
