# BAWDYHAUZ App Store And Play Store Readiness

This document prepares BAWDYHAUZ for iOS App Store and Google Play submission without changing the product design or adding payments.

## App Metadata Checklist

- App name: `BAWDYHAUZ`
- Subtitle/tagline: `Private matchmaking, wellness and concierge introductions`
- Short description: `A curated members ecosystem for private introductions, wellness support and concierge-led dating.`
- Long description: BAWDYHAUZ is a private, manually reviewed members platform for curated introductions, relationship wellness, private experiences and concierge-arranged dating. Members apply, verify, and are reviewed before access. The experience prioritises safety, privacy, emotional intelligence and human-led moderation.
- Keywords: private members club, matchmaking, relationship wellness, concierge dating, curated introductions, private events, safety, verified members
- Primary category: Lifestyle
- Secondary category: Social Networking
- Age rating: 18+ only. The app includes dating/social introduction functionality, private messaging and member reporting tools. It does not include explicit content as a product feature.
- Support URL placeholder: `https://www.bawdyhauz.com/support`
- Marketing URL placeholder: `https://www.bawdyhauz.com`
- Privacy policy URL placeholder: `https://www.bawdyhauz.com/privacy`
- Terms URL placeholder: `https://www.bawdyhauz.com/terms`

## Store Asset Checklist

iOS App Store:

- App icon: 1024 x 1024 PNG, no transparency.
- Screenshots: required for supported iPhone sizes. Capture splash, application flow, approved member home, discover, messages, wellness, experiences, safety and admin only if admin is part of review notes.
- App preview video: optional. If used, keep tone discreet and show safety/review flow.
- Splash screen: current logo on matte black is aligned with brand.

Google Play:

- App icon: 512 x 512 PNG.
- Feature graphic: 1024 x 500 PNG.
- Phone screenshots: minimum 2, recommended 6-8.
- Short description: 80 characters max.
- Full description: 4000 characters max.
- Preview video: optional YouTube URL.

## Compliance Screens And Policies

The app and website need public policy pages before submission:

- Privacy Policy: data collected, Supabase Auth, profile data, messages, verification files, safety reports, media uploads, analytics, email/push notifications.
- Terms: membership review, acceptable use, account status, cancellation of access, external shop handling.
- Community Standards: mature conduct, no harassment, no misrepresentation, no unsafe behaviour, no explicit public content.
- Safety Policy: reporting, blocking, investigation, moderation, user standing, emergency disclaimer.
- Member Conduct Policy: consent, privacy, respectful communication, venue behaviour, no-show expectations.
- Age Gate: 18+ positioning must be clear at onboarding and in store metadata.
- Verification Explanation: identity/selfie review is human-led and protected.

## Expo And EAS Readiness

Current config:

- Expo SDK: 54
- iOS bundle id: `com.bawdyhauz.mobile`
- Android package: `com.bawdyhauz.mobile`
- App scheme: `bawdyhauz`
- EAS config: `eas.json`

Build commands:

```bash
npx eas build --profile preview --platform android
npx eas build --profile preview --platform ios
npx eas build --profile production --platform android
npx eas build --profile production --platform ios
```

Submit commands, after store accounts are configured:

```bash
npx eas submit --profile production --platform android
npx eas submit --profile production --platform ios
```

## Environment Variable Checklist

Expo public values only:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_USE_SUPABASE`

Server-side secrets only:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- future Stripe secret keys
- future push provider credentials
- future AI provider keys

Never expose service-role or private provider keys in Expo.

## iOS Build Checklist

- Apple Developer account active.
- Bundle identifier registered.
- App Store Connect app created.
- Privacy policy URL available.
- Age rating completed as 18+.
- Sign in/review test account prepared.
- Reviewer notes explain manual membership review, reporting, blocking, moderation and verification.
- If camera/photo access is used, permission strings explain private review use.

## Android Build Checklist

- Google Play Console account active.
- Package name confirmed.
- Data Safety form completed.
- Privacy policy URL available.
- Target audience set to adults only.
- App content declaration completed.
- Internal testing track used before production.
- Feature graphic and screenshots uploaded.

## App Review Risk Notes

Dating/social apps receive review attention around:

- user-generated content moderation
- blocking and reporting
- safety policy clarity
- age gating
- privacy for sensitive data
- account deletion/support paths
- misleading claims around therapy, safety, or verification

BAWDYHAUZ mitigations already present or planned:

- manual approval gate
- reporting flows
- safety centre
- moderation/admin dashboards
- protected verification/report storage
- no explicit content product feature
- therapist/wellness wording avoids medical claims
- external shop only, no native store
