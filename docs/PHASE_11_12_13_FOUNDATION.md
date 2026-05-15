# BAWDYHAUZ Phase 11-13 Foundation

This phase extends the existing Supabase-connected architecture. It does not replace the current
auth gate, approval flow, messaging, concierge, profile, storage, notification, or AI placeholder
systems.

## Phase 11: Advanced Admin And Moderation

Live foundations:

- Advanced admin moderation dashboard in the existing admin tab.
- Incident review backed by `incidents`, `safety_reports`, and `incident_evidence`.
- Moderation action workflow backed by `moderation_actions` and `audit_logs`.
- Trust score dashboard foundation via `user_trust_snapshots`.
- User safety history from recent moderation actions.
- Admin audit visibility from `audit_logs`.
- Escalation workflow using incident escalation fields.
- Evidence review workflow for private report evidence metadata.
- Flagged behaviour review via `flagged_behaviour_reviews`.

Review-only placeholders:

- AI moderation context remains advisory only.
- `ban_review` records a human review action and audit entry, but does not automatically ban.
- Trust score updates are a foundation table; automated scoring is not enabled.

Access control:

- Admin dashboard screens are hidden from non-admin members in the app shell.
- Connected admin services call `requireAdminUser()` before returning protected data.
- RLS keeps incident internals, evidence, moderation actions, notes, and audit records admin-only.

## Phase 12: Analytics And Growth Infrastructure

Live foundations:

- `analytics_events` records privacy-sanitized event names, source areas, and non-sensitive metadata.
- `conversion_funnels` and `cohort_metrics` prepare investor and lifecycle reporting.
- `trackAnalyticsEvent()` strips sensitive keys before writing.
- Admin analytics dashboard reads aggregate metrics through `admin_analytics_summary()`.
- Conversion, approval, engagement, concierge, therapist, experience, safety, subscription, and founding-member metrics are aggregated.

Placeholders:

- Retention and cohort modelling are marked `foundation_ready`.
- `analytics_daily_metrics` is available for future scheduled aggregation.
- CAC, LTV, retention and subscription conversion remain placeholder investor metrics.

Privacy guardrails:

- No member-facing analytics dashboard exists.
- Raw analytics rows are not selectable by members.
- The admin dashboard displays aggregate counts only, not user-level analytics.

## Phase 13: Production Security Hardening

Live foundations:

- Restrictive write policies block restricted, suspended, and banned users from key member writes.
- `current_user_can_write()` centralizes member write eligibility for RLS.
- Rate limit events, suspicious activity events, abuse detection signals, blocked device/email/phone placeholders, device sessions and user sessions have protected tables.
- Admin security dashboard shows internal signals and session revoke placeholders.
- Session revoke requests are logged as placeholders and audit events; they do not invalidate Supabase sessions automatically.

Placeholders:

- Server-side rate limiting is not active in the mobile app.
- Abuse detection is review-only.
- Device/session revocation requires a future server-side Supabase Auth admin implementation.

## Test Expectations

After migration:

- Non-admin users should not be able to select admin-only tables.
- Non-admin users should not see the admin tab.
- Restricted, suspended, and banned users should be blocked from protected member writes by RLS.
- Admin moderation actions should create `moderation_actions` and `audit_logs`.
- Analytics recording should write sanitized events only.
- Admin analytics should return aggregate metrics without sensitive user detail.
