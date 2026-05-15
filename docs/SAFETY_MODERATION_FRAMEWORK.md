# BAWDYHAUZ Safety And Moderation Framework

## Manual Vetting

Every member applies, verifies and is reviewed before entering the private ecosystem. Approval is not instant or automatic.

Review signals:

- identity readiness
- profile completeness
- intention
- lifestyle fit
- safety notes
- verification state
- admin notes

## Reporting

Members can report:

- inappropriate behaviour
- harassment
- no-show
- misrepresentation
- unsafe conduct
- other concern

Reports create private review records and can attach protected evidence.

## Investigation

Safety reports feed:

- `safety_reports`
- `incidents`
- `incident_evidence`
- `moderation_actions`
- `audit_logs`

Incident states include:

- report received
- under review
- action taken
- closed

## User Standing

Standing values:

- clear
- flagged
- restricted
- suspended
- banned

Restricted, suspended and banned users are blocked from key writes by production hardening policies.

## Moderation Actions

Admin actions include:

- warn
- restrict
- suspend
- ban review
- close case
- request more evidence
- escalate for human review

Any final ban/restriction must remain human-led. AI suggestions are review-only.

## Audit Trail

Admin-sensitive actions should create:

- `moderation_actions`
- `admin_notes`
- `audit_logs`

No silent moderation changes should happen in production.

## Member-Facing Tone

Safety copy should be calm, discreet and protective. It should never feel aggressive, punitive or police-like.
