# BAWDYHAUZ Row Level Security Plan

This is the live-connection planning document. The app remains in mock mode until real Supabase
environment variables are provided.

## Member Visibility

- Members can read only approved, public-safe profile fields.
- Members can read their own application, verification, therapy sessions, RSVPs, reports and reviews.
- Members can only edit their own profile and application records.
- Members cannot read raw admin notes, moderation actions, audit logs or incident internals.

## Matchmaking And Messaging

- Match rows are visible only to the two matched profile owners and admins.
- Message threads are visible only to thread members and admins.
- Messages can only be inserted by thread members.
- Video dates are visible only to matched users and admins.

## Safety And Reports

- Safety reports are private to the reporter and admins.
- Incident details, moderation actions and admin notes are admin-only.
- User standing is stored on `users` and should be changed only through admin-controlled actions.

## Admin Protection

- Admin-only tables are protected through `public.is_admin()`.
- Admin dashboard in the app is currently a local placeholder and must not be considered access control.
- Live admin access requires real auth roles, server-side audit logging and careful policy review.

## Banned / Restricted Users

- Client gating plan:
  - `pending` users see application status.
  - `approved` users see the main app.
  - `banned` users see restricted access.
  - `admin` users see admin operations.
- Server-side restrictive policies now use `public.current_user_can_write()` to deny key member
  writes for restricted, suspended and banned users.

## Phase 11-13 Admin-Only Additions

- Incident evidence, trust snapshots, flagged behaviour reviews, moderation action history and audit
  visibility are admin-only.
- Analytics events are insert-only for members and read only by admins; the app dashboard displays
  aggregate metrics from `public.admin_analytics_summary()`.
- Rate limit events, suspicious activity events, abuse detection signals and device session revoke
  placeholders are protected as admin-only review surfaces.
- AI recommendations and abuse signals are review-only and must not automatically ban or restrict a
  member.
