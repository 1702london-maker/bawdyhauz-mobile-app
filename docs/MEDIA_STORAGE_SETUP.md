# Media & Storage Setup

BAWDYHAUZ media uses Supabase Storage with private-by-default handling for sensitive files.

## Buckets

- `profile-photos`: public bucket for approved profile imagery, with review metadata.
- `private-gallery`: private member gallery storage.
- `verification-documents`: protected ID/selfie verification files.
- `report-evidence`: protected safety report evidence.
- `experience-images`: public bucket for approved experience imagery.

## Migration

Run:

```bash
npx supabase db push
```

This applies `0015_email_push_media_storage.sql`, adding media metadata, stronger storage read policies and email log delivery fields.

## Access Rules

- Members can upload and manage their own profile/private gallery files.
- Members can read their own private gallery, verification and report evidence files.
- Verification documents are never visible to normal members other than the uploader.
- Report evidence is private to the reporter and admins.
- Admins can review/manage protected media.
- Experience images remain reviewable before public-safe presentation.

## App Behaviour

The app now includes upload surfaces for:

- application profile image
- member profile primary image
- private gallery image
- ID verification document
- selfie verification image
- safety report evidence
- admin experience image placeholder

All upload wording is member-facing and discreet. Live moderation/approval of media is still a future phase.
