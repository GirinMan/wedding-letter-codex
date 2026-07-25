---
name: build-wedding-invitation
description: Build, revise, or validate the mobile wedding invitation in this repository. Use for invitation setup, wedding information or copy changes, section and interaction work, account/contact/venue updates, optional gallery/music/share features, design-system replacement, partial regeneration, responsive QA, accessibility QA, or deployment readiness.
---

# Build Wedding Invitation

Keep the invitation useful without coupling it to one aesthetic. Treat content, behavior, and the design system as separate contracts.

## Read the right contracts

- Read [content-contract.md](references/content-contract.md) before changing wedding data, copy, sections, contacts, accounts, venue, gallery, RSVP, sharing, or music.
- Read [design-system-contract.md](references/design-system-contract.md) before changing markup, CSS, themes, media slots, or visual assets.
- Read [qa-checklist.md](references/qa-checklist.md) before validation or handoff.

## Classify the request

1. Inspect `app/data/invitation.js`, the active design-system stylesheet in `app/index.html`, and existing `_workspace/` artifacts.
2. Classify the request as one or more of:
   - content-only
   - behavior-only
   - design-system-only
   - media-only
   - full build
   - QA/deployment
3. Touch only the affected contract. Cascade to core rendering only when the contract requires it.
4. Back up `_workspace/` only when replacing an established plan. Never back up generated runtime files automatically.

## Plan a full build

For a full build or a large revision:

1. Gather required names, event date/time/timezone, venue, greeting, host relationships, and desired sections.
2. Keep unknown private values as placeholders. Never publish real account or contact details without explicit confirmation.
3. When parallelism is useful, spawn at most two independent subagents:
   - `invitation_planner` for section and feature contracts
   - `invitation_content` for copy and structured data
4. Wait for both, reconcile conflicts in the parent, and treat confirmed user facts as the source of truth.
5. Assign integration to `invitation_frontend` or implement it in the parent. Avoid parallel edits to the same runtime files.
6. Run `invitation_reviewer` after implementation, then fix and re-run failed checks. Stop after two failed repair loops and report the exact blocker.

Do not spawn subagents for a small content edit, token swap, or isolated bug fix.

## Preserve boundaries

- Put all wedding-specific data and feature flags in `app/data/invitation.js`.
- Keep structural and interaction CSS in `app/styles/core.css`.
- Keep colors, typography, spacing character, radii, shadows, and motion feel in `app/design-systems/*.css`.
- Reference images and audio from data. Do not make them required for the core page to function.
- Keep optional sections hidden when disabled or empty.
- Prefer progressive enhancement for clipboard, Web Share, vibration, audio, and dialogs.

## Partial rerun map

| Request | Primary files | Required downstream work |
|---|---|---|
| Names, date, venue, greeting | `app/data/invitation.js` | validate + browser smoke |
| Account/contact details | `app/data/invitation.js` | privacy review + clipboard/contact smoke |
| Gallery or music | data + media files | asset validation + interaction smoke |
| Colors, type, spacing, surfaces | active `app/design-systems/*.css` | responsive browser review |
| Section structure or behavior | renderer/core CSS/scripts | tests + full browser flow |
| Entire visual direction | new design-system file + media references | do not rewrite core behavior unless contract changes |

## Validate

Run:

```bash
npm test
npm run validate
```

For runtime changes, serve `app/` and verify desktop and mobile widths. Exercise D-day rendering, venue link, contact links, account copy, gallery dialog, share fallback, RSVP visibility, optional music, and keyboard focus as applicable.

Summarize changed contracts, remaining placeholders, disabled optional features, verification evidence, and any privacy-sensitive data that must stay out of git.
