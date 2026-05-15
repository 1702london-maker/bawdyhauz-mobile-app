# BAWDYHAUZ Beta, Operations And Global Scaling

## Phase 17: Luxury UX Refinement

Client-facing screens must avoid build language. Members should see calm, private, human-led copy:

- use "received", "under review", "prepared", "private review" and "member services"
- avoid "mock", "placeholder", "future phase", "shell" and engineering terms
- keep moderation, analytics and security details inside admin-only views
- keep the Shop as an external website action

The beta pass should be repeated before screenshots are captured for App Store and Play Store submission.

## Phase 18: Beta Launch Infrastructure

Live-ready tables:

- `beta_invites`
- `beta_cohorts`
- `beta_cohort_members`
- `beta_feedback`
- `referrals`
- enhanced `website_waitlist`

Core beta workflows:

- admins create invite codes
- candidates are assigned to cohorts
- waitlist entries can carry priority notes and referral source
- approved members can submit beta feedback and support requests
- admins review feedback from the private operations area

## Phase 19: Operational Team Tools

Live-ready tables and enhancements:

- `concierge_member_notes`
- enhanced `therapists`
- enhanced `venues`
- enhanced `private_experiences`
- `support_tickets`
- `support_ticket_notes`

Operational areas:

- Concierge CRM
- therapist management
- venue management
- private experience management
- support ticket review
- shared internal notes discipline

Every sensitive admin action should carry context in `admin_notes`, domain notes, or `audit_logs`.

## Phase 20: Global Scaling Architecture

Live-ready tables:

- `supported_cities`
- `locale_copy_registry`

Scaling plans:

- launch city by city
- confirm concierge, therapist and venue coverage before expansion
- keep locale, currency and timezone explicit per city
- run RLS and index reviews before increasing volume
- validate backup/restore before each launch campaign

## City Launch Checklist

1. Confirm local legal, privacy and safety requirements.
2. Prepare first concierge and venue partner map.
3. Review therapist support coverage.
4. Invite a small vetted beta cohort.
5. Run weekly support, incident and satisfaction review.
6. Review RLS query plans and storage access.
7. Confirm moderation staffing coverage.

## Staffing Model

Minimum city launch team:

- city concierge lead
- membership reviewer
- support reviewer
- safety/moderation reviewer
- therapist partnership owner
- venue partnership owner

## Technical Scaling Notes

- Index city/status filters used by Discover, concierge and events.
- Keep storage policies restrictive for private galleries, verification and report evidence.
- Avoid exposing protected operational records to member clients.
- Use staging before production for every migration.
- Keep Edge Function secrets separate by environment.
