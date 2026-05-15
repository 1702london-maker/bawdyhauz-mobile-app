# BAWDYHAUZ Resend Email Foundation

Live email sending is not enabled in this phase. Email events are logged and the Supabase Edge Function is scaffolded.

## Secret Handling

Never put `RESEND_API_KEY` in Expo or `.env.local`.

Store it only as a Supabase Edge Function secret:

```bash
supabase secrets set RESEND_API_KEY=re_xxx
```

## Edge Function

Scaffold:

```text
supabase/functions/send-email/index.ts
```

Deploy later with:

```bash
supabase functions deploy send-email
```

## Current Behavior

If `RESEND_API_KEY` is missing, the function writes a skipped delivery state where possible and does not crash the app.

For live delivery, configure Supabase Edge Function secrets only:

```bash
npx supabase secrets set RESEND_API_KEY=re_xxx
npx supabase secrets set RESEND_FROM_EMAIL="BAWDYHAUZ <notifications@your-verified-domain.com>"
```

Supabase reserved runtime variables such as `SUPABASE_SERVICE_ROLE_KEY` are provided automatically
to Edge Functions. Do not set `SUPABASE_` secrets manually, and never place service-role values in
Expo, `.env.local`, or client code.

The app records:

- `notification_events`
- `email_logs`

Email logs track recipient, event type, status, provider id, created time, sent time and error message.

Templates are rendered in:

```text
src/services/emailTemplates.ts
```

## Email Event Types

- application received
- application approved
- rejected
- waitlisted
- request more information
- verification required
- match created
- video date scheduled
- concierge request received
- concierge date confirmed
- therapist booking received
- therapist booking confirmed
- experience invite/request received
- RSVP confirmed
- safety report received
- admin new application alert
