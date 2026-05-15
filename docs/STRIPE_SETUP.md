# BAWDYHAUZ Stripe Setup Placeholder

Live Stripe checkout is intentionally not enabled in this phase.

## Mobile App Rules

The Expo app may only receive:

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Never place these in Expo:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- restricted API keys

## Server / Edge Function Secrets

When the live checkout phase begins, store secrets in Supabase Edge Function secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_or_test_value
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_value
```

Scaffolded functions:

- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

## Webhook Responsibilities

The webhook should eventually:

- verify the Stripe signature
- map Stripe customer/subscription IDs to `public.subscriptions`
- insert `public.payment_events`
- update `public.invoices`
- update membership tier/status entitlements
- never trust client-provided payment status

## Current Phase

This phase only creates:

- membership plan tables
- subscription records
- payment event placeholders
- invoice placeholders
- entitlement rules
- UI and service placeholders

No real payments are processed yet.
