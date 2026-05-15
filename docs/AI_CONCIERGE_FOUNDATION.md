# AI Concierge Foundation

This phase prepares BAWDYHAUZ for AI-assisted operations without connecting paid AI APIs.

## Principle

AI never makes final decisions. Approvals, rejections, bans, restrictions, concierge actions and safety decisions remain human-led.

## Prepared Services

The app includes placeholders for:

- match explanation
- conversation suggestions
- venue suggestions
- therapist/wellness suggestions
- safety anomaly flags
- profile improvement suggestions

## Prompt Templates

Prompt templates live in the app service layer and are intentionally framed as internal guidance. They avoid explicit content, medical claims and automated enforcement.

## Tables

Migration `0016_profile_ai_website_unification.sql` creates:

- `ai_requests`
- `ai_recommendations`
- `ai_review_flags`

These track request type, input summary, output summary, status, admin review state and created time.

## Admin Review

The Admin Dashboard includes an assistant review queue. Recommendations are labelled as review-only and must be manually marked reviewed by an admin.

## Future Live AI

When a live AI provider is added, API keys must stay server-side only, preferably in Supabase Edge Function secrets. The mobile app should only request a server-side recommendation, never call a paid AI API directly.
