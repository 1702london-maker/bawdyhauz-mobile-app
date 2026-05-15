# BAWDYHAUZ Push Notification Foundation

Push notifications use Expo notification APIs and Supabase storage for tokens and preferences.

## Current Phase

This phase supports:

- permission request flow
- push token registration
- token storage in `push_tokens`
- user preference storage in `notification_preferences`
- graceful behavior when permission is denied

Live delivery is not enabled yet.

## Tables

- `push_tokens`
- `notification_preferences`
- `notification_events`

## User Preferences

Available toggles:

- matches
- messages
- video dates
- concierge updates
- therapist bookings
- private experiences
- safety/admin notices
- marketing/offers

Marketing defaults to off.

## Delivery Scaffold

Supabase Edge Function:

```text
supabase/functions/send-push/index.ts
```

Deploy later with:

```bash
supabase functions deploy send-push
```

## Privacy

If a member denies push permission, the app continues normally and saves no device token.
