# Claude UI Review Handoff

## Review Purpose

Claude should perform a client-facing luxury UI and copy cleanup pass after the website-to-app flow is verified.

Do not change:

- BAWDYHAUZ brand DNA
- Cormorant Garamond / Jost typography
- monochrome luxury palette
- dark editorial atmosphere
- faint grid/grain texture
- thin borders
- premium spacing
- private-members-club tone
- Supabase architecture, RLS, auth gating or admin protection

## Screens To Review

Member-facing:

- Splash
- Age gate
- Onboarding
- Auth
- Application
- Verification
- Application status
- Member home
- Discover
- Profile preview
- Matches
- Messages
- Video introduction prompt
- Concierge request
- Therapist & Wellness
- Private Experiences
- Safety
- Profile
- Settings
- Beta feedback

Admin/internal:

- Admin home
- Applications
- Verifications
- Concierge
- Therapist bookings
- Experiences
- Subscriptions placeholder
- Assistant review
- Moderation
- Analytics
- Security
- Beta launch
- Operations tools
- Global scaling

## Copy Cleanup Rules

Remove client-facing wording such as:

- placeholder
- mock
- future phase
- local foundation
- shell
- test data
- later build
- developer-only language

Use language such as:

- private review
- member services
- received
- prepared
- under consideration
- manually reviewed
- access pending
- concierge review
- discreet support

## UX Polish Focus

Claude should look for:

- headings clipping on smaller Android screens
- oversized cards compressing content
- bottom tab usability with many tabs
- excessive admin density on small screens
- inconsistent empty states
- button labels that feel too technical
- copy that explains implementation instead of experience
- status badges that need clearer luxury language

## Known Product Boundary

Website:

- public gateway
- applications/waitlist
- editorial/marketing
- external shop

App:

- approved private member ecosystem
- no native shop
- Supabase-authenticated member flows
- admin operations for human-led review

## Technical Guardrails

Claude should not:

- redesign the app from scratch
- change core navigation architecture without need
- weaken RLS assumptions
- expose admin data to members
- build Stripe checkout
- move secrets into the app
- make AI decisioning automatic

## Recommended First Pass

1. Review screenshots on Android small, Android large and iOS.
2. Rewrite any remaining client-facing implementation language.
3. Tighten tab navigation labels and spacing.
4. Check all empty/loading/error states.
5. Verify auth state copy for pending, approved, rejected, waitlisted, restricted and banned.
6. Prepare final App Store screenshot copy only after UI is stable.
