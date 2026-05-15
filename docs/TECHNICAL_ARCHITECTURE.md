# BAWDYHAUZ Technical Architecture

## Mobile App

- Expo React Native.
- TypeScript.
- Expo SDK 54.
- Cormorant Garamond and Jost font system.
- Supabase client with public publishable key only.
- Mock-safe fallback when Supabase is not configured.

## Navigation And Access

- Supabase Auth manages email sessions.
- Account state routes users to anonymous, pending, rejected, waitlisted, restricted, banned, approved or admin experiences.
- Admin tab is hidden for non-admin users.

## Supabase Backend

Core domains:

- users and profiles
- membership applications
- verification checks
- matches
- message threads and messages
- video dates
- concierge requests and venues
- therapists and therapy sessions
- private experiences and RSVPs
- reviews and safety reports
- incidents and moderation actions
- admin notes and audit logs
- analytics and security signals
- notification events and email/push logs
- media metadata

## RLS And Security Model

- Members can read only appropriate own/public-safe records.
- Messaging is limited to thread participants.
- Verification and report evidence are protected.
- Admin-only tables require `public.is_admin()`.
- Restricted, suspended and banned users are blocked from key writes through restrictive policies.
- Admin actions write audit records.

## Edge Functions

Current scaffolds:

- `send-email`
- `send-push`
- `admin-actions`

Secrets remain server-side. Expo never receives service-role, Resend, Stripe, AI or private push credentials.

## Storage

Buckets:

- `profile-photos`
- `private-gallery`
- `verification-documents`
- `report-evidence`
- `experience-images`

Storage policies separate public-safe media from protected review files.

## Notifications

- Email events use `notification_events` and `email_logs`.
- Push preferences and tokens use `notification_preferences` and `push_tokens`.
- Live delivery is staged through Edge Function foundations.

## Admin Operations

Admin screens support:

- applications
- verifications
- concierge
- therapist bookings
- experiences
- subscriptions placeholders
- AI recommendation review
- advanced moderation
- analytics
- production security signals

## Future AI Layer

AI is prepared through:

- `ai_requests`
- `ai_recommendations`
- `ai_review_flags`
- prompt templates
- admin review queue

AI must never auto-approve, auto-ban or make final moderation decisions.
