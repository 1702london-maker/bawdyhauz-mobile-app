# Website and App Unification

BAWDYHAUZ website and mobile app should share one Supabase backend.

## Shared Auth Plan

- Website and app use the same Supabase user accounts.
- Application status is stored in `membership_applications`.
- Membership/tier status is stored in the existing membership tables.
- Profile data is stored in `profiles`.
- Approved members log into the app with the same email identity used during application.

## Website Application Flow

The website should submit membership applications into Supabase using the same shape as the app:

- create/sign in Supabase user
- insert `users` row if required
- insert `membership_applications`
- optionally insert draft `profiles`
- trigger `application_received`
- trigger `admin_new_application_alert`

The website should never use the service-role key in public browser code. Public forms should submit through a server route, Supabase Edge Function, or secured backend endpoint.

## Application Status

Website status pages can read the latest `membership_applications.status` for the signed-in user. Public unauthenticated status lookup should not expose application details.

## App Download/Login

After approval:

1. User receives approval email.
2. Email links to app download/login.
3. User logs into the app with the same Supabase account.
4. App approval gating reads `profiles.is_approved`, `profiles.is_public_safe`, user role and standing.
5. Member completes profile quality prompts.

## Shop

The shop remains external at `https://www.bawdyhauz.com/shop`. The app should keep only the external Shop button and may record future `shop_referrals`.

## Events Sync

Website public events can use:

- `public_events` for public website listings
- `private_experiences` for app member experiences
- `public_events.app_experience_id` to link a website listing to a private app experience

## Public Waitlist and Leads

Migration `0016_profile_ai_website_unification.sql` prepares:

- `landing_page_leads`
- `website_waitlist`
- `shop_referrals`
- `public_events`
- `editorial_content`

Public forms should include anti-spam controls, rate limiting and server-side validation before writing to Supabase. Waitlist submissions should route into admin review and may trigger email notifications.

## Web-to-App Journey

1. Visitor lands on BAWDYHAUZ website.
2. Visitor applies or joins waitlist.
3. Application enters human review.
4. User receives approval, waitlist or more-information email.
5. Approved user downloads/logs into app.
6. User completes profile media and profile quality prompts.
7. User enters the private matchmaking, wellness, experiences and concierge ecosystem.

No website repo is present in this workspace, so this phase prepares backend/docs only.
