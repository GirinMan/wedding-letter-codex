---
name: build-wedding-invitation
description: Build, revise, validate, or deploy the database-managed public wedding invitation and its private admin workspace.
---

# Build Wedding Invitation

Keep the invitation editable without coupling content, behavior, media, and
visual style.

## Read the contracts

- Read [content-contract.md](references/content-contract.md) before changing
  content, schemas, contacts, accounts, event data, RSVP, guestbook, or uploads.
- Read [design-system-contract.md](references/design-system-contract.md) before
  changing public/admin markup, CSS, tokens, media frames, or motion.
- Read [qa-checklist.md](references/qa-checklist.md) before validation or handoff.

## Classify the request

Classify work as one or more of:

- content/schema
- public behavior
- admin behavior
- design-system
- media/storage
- API/security
- QA/deployment

Touch only the affected contract. Add a forward-only migration when persisted
schema changes.

## Full build workflow

1. Inspect the domain schema, migration state, public app, admin app, and current
   concept/audit documents.
2. Keep unknown private values as generic seed placeholders.
3. Implement API and persistence before wiring a UI that depends on them.
4. Run PostgreSQL and MinIO locally through Docker Compose.
5. Verify public and admin flows through the same API.
6. Confirm production compose keeps public and admin routing separate.

When parallelism is useful, use at most two independent subagents. Do not use
subagents for a small edit.

## Preserve boundaries

- Validate editable content in `apps/api/src/domain/invitation.ts`.
- Store runtime content and design tokens in PostgreSQL, not bundled frontend
  constants.
- Store binary media in MinIO and only metadata/object keys in PostgreSQL.
- Keep public behaviors in `apps/public-web` and admin tools in `apps/admin-web`.
- Map DB design tokens to semantic CSS custom properties.
- Keep optional sections absent or disabled when their flags are off.
- Prefer progressive enhancement for clipboard, Web Share, audio, maps, and
  third-party SDK adapters.

## Partial rerun map

| Request | Primary area | Required downstream work |
|---|---|---|
| Names, date, venue, greeting | admin/content API | schema test + public browser smoke |
| Accounts or contacts | content API/admin | privacy review + public action smoke |
| Gallery or music | media API/MinIO/admin | upload + publish + public fetch |
| RSVP or guestbook | public API/admin moderation | validation/rate-limit + round trip |
| Colors, type, spacing | design schema/admin/public CSS | preview + responsive review |
| Persisted schema | SQL migration/API | clean DB migration + compatibility |
| Production topology | IaC compose/scripts | compose validation + health checks |

## Validate

```bash
npm run check
docker compose config --quiet
docker compose up -d --build
docker compose --profile tools run --rm seed
```

Then verify page identity, meaningful DOM, console health, screenshot evidence,
and at least one affected interaction in Browser. Report remaining placeholders,
disabled integrations, private deployment inputs, and untested production state.
