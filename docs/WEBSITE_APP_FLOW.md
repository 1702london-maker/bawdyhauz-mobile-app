# BAWDYHAUZ Website To App Flow

## Product Boundary

BAWDYHAUZ uses a clean public/private split:

- Website: public gateway, editorial brand surface, application entry, waitlist and external shop.
- Mobile app: private members ecosystem for approved users.
- Supabase: shared backend for accounts, applications, profiles, approvals, events and operations.

The mobile app must not contain a native shop. The app header opens the external website shop at `https://www.bawdyhauz.com/shop`.

## Public Website Application Flow

The website can send two levels of intent into Supabase:

1. Public lead or waitlist:
   - table: `website_waitlist`
   - suitable for unauthenticated public forms
   - captures `email`, `name`, `city`, `intention`, `referral_source`, `status`
   - appears in the admin approval queue as `Website gateway`

2. Authenticated application:
   - table: `membership_applications`
   - suitable when the website uses Supabase Auth
   - tied to `auth.users` and `public.users`
   - approved users can log into the mobile app with the same email

The app service `submitWebsiteWaitlistLead` in `src/services/websiteAppFlow.ts` documents the public lead insert shape for website reuse.

## Admin Review Flow

The admin application queue now shows:

- mobile app applications from `membership_applications`
- public website leads from `website_waitlist`

Admin actions on mobile app applications update:

- `membership_applications.status`
- `users.standing`
- `profiles.is_approved`
- `profiles.is_public_safe`
- `audit_logs`

Admin actions on website leads update:

- `website_waitlist.status`
- `website_waitlist.admin_status`
- optional `admin_notes`
- `audit_logs`

Website leads do not become approved app members until they create or receive a Supabase Auth account and submit or link a membership application.

## Shared Login And Approval

Approved users log into the app with the same email identity used by the website if the website uses Supabase Auth.

Routing is controlled by:

- Supabase Auth session
- `public.users.role`
- `public.users.standing`
- latest `membership_applications.status`
- `profiles.is_approved`

Expected app routing:

- no session: age gate/onboarding/login
- pending application: application status
- rejected/waitlisted/restricted/banned: account status
- approved profile: private member shell
- admin role: admin dashboard inside the private shell

## Deep Links

Configured custom scheme:

- `bawdyhauz://login`
- `bawdyhauz://apply`
- `bawdyhauz://status`
- `bawdyhauz://home`
- `bawdyhauz://beta`

Configured HTTPS app-link foundation:

- `https://www.bawdyhauz.com/app`
- `https://bawdyhauz.com/app`

Website and email CTAs should use:

- login: `bawdyhauz://login?email=member@example.com`
- application status: `bawdyhauz://status?email=member@example.com`
- member home: `bawdyhauz://home`

Production app links still require:

- Apple App Site Association file at `https://www.bawdyhauz.com/.well-known/apple-app-site-association`
- Android Asset Links file at `https://www.bawdyhauz.com/.well-known/assetlinks.json`
- final app store package and signing fingerprints

## Website Implementation Notes

Unauthenticated public form:

```ts
await supabase.from("website_waitlist").insert({
  email,
  name,
  city,
  intention,
  referral_source: "website_application",
  status: "received"
});
```

Authenticated application form:

```ts
await supabase.from("membership_applications").insert({
  user_id: user.id,
  status: "submitted",
  legal_name,
  city,
  age_confirmed: true,
  intentions,
  lifestyle_interests,
  private_notes,
  social_links
});
```

The website should never use service-role keys in browser code. Service-role operations belong only in Supabase Edge Functions or another server environment.

## Email Handoff

Approval emails should include:

- app login link
- member status link
- support contact
- reminder that access is private and manually approved

Example:

```text
bawdyhauz://login?email=member@example.com
```

If the app is not installed, the website should show app download links once App Store and Play Store URLs exist.
