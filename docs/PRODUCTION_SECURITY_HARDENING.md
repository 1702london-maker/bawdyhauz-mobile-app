# BAWDYHAUZ Production Security Hardening

This document captures the production security posture added for Phase 13.

## Environment

Expo must only receive public client configuration:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
EXPO_PUBLIC_USE_SUPABASE=true
```

Never expose these values in the mobile app:

- `SUPABASE_SERVICE_ROLE_KEY`
- Resend, Stripe, analytics provider, or push provider secrets
- Any moderation automation or abuse-detection provider secret

Server-only secrets belong in Supabase Edge Function secrets:

```bash
supabase secrets set RESEND_API_KEY=...
```

Supabase automatically provides reserved runtime variables such as `SUPABASE_SERVICE_ROLE_KEY` to
Edge Functions. Do not try to set secrets whose names begin with `SUPABASE_` through the CLI.

## RLS Hardening

The Phase 13 migration adds `public.current_user_can_write()`. Restrictive write policies use it
to block restricted, suspended, and banned users from key member writes:

- profiles
- membership applications
- messages
- safety reports
- reviews
- concierge requests
- therapy sessions
- experience RSVPs and waitlists

Admin-only records remain protected by `public.is_admin()`:

- incidents
- moderation actions
- incident evidence
- trust snapshots
- flagged behaviour reviews
- audit logs
- analytics metrics
- rate limit and suspicious activity records
- abuse detection signals
- device session review records

## Moderation Safety

AI moderation output is review-only. It can create context for a human reviewer, but it must not
directly change account standing.

`ban_review` is intentionally not a ban. It logs a moderation action and audit event for human
review. Any production ban flow should require a separate admin confirmation path and service-role
server validation.

## Rate Limiting And Abuse Detection

The app now has data foundations for:

- `rate_limit_events`
- `suspicious_activity_events`
- `abuse_detection_signals`
- `blocked_devices`
- `blocked_emails`
- `blocked_phone_numbers`

Production rate limiting should run at the server edge, not in the client. Recommended enforcement
points:

- Supabase Edge Functions
- API gateway or reverse proxy
- Auth sign-in and password reset flows
- Message send, report submit, concierge request, and media upload flows

## Device And Session Management

`device_sessions` and `user_sessions` store reviewable session/device metadata and support admin
revoke/logout-all requests as placeholders.

The current app does not invalidate Supabase Auth sessions from the client. Production revocation
requires a service-role function that calls Supabase Auth admin APIs, records an audit log, and
keeps the member-facing UX quiet.

## Production Checklist

- Apply migrations through `supabase db push`.
- Confirm RLS is enabled on every new table.
- Confirm non-admin users cannot read admin-only records.
- Confirm restricted, suspended, and banned users cannot perform protected writes.
- Deploy `admin-actions`, `send-email`, and push/email functions with server-only secrets.
- Keep analytics aggregate-only in admin dashboards.
- Keep raw report evidence private to reporters and admins.
- Rotate or remove any test accounts before launch.
