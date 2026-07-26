# Wedding Letter Codex

## Purpose

Build and maintain a database-managed Korean mobile wedding invitation with a
separate private admin workspace.

## Source of truth

- `apps/api/src/domain/invitation.ts`: validated content and design contracts
- PostgreSQL `invitations`: draft and published runtime content
- PostgreSQL operational tables: RSVP, guestbook, media metadata, uploads, admin sessions
- S3-compatible object storage: uploaded images, music, and guest photographs
- `apps/public-web`: public invitation behavior and structural presentation
- `apps/admin-web`: authenticated editor and moderation workspace
- `docs/concepts/wedding-platform-concept.png`: accepted visual concept

Do not hard-code real wedding details, account numbers, private contact data,
credentials, or production media URLs in this public repository. The committed
seed contains generic placeholders only.

## Required workflow

- Use `$build-wedding-invitation` for any request that creates, changes, or
  validates the invitation.
- Preserve the boundary between validated content, replaceable design tokens,
  operational behavior, and media storage.
- Schema changes require a forward-only SQL migration in `apps/api/migrations`.
- Public write APIs require validation and rate limiting.
- Admin mutations require the authenticated server-side session.
- Use semantic HTML, keyboard-accessible controls, and reduced-motion-safe behavior.

## Verification

Run before handoff:

```bash
npm run check
docker compose config --quiet
docker compose up -d --build
docker compose --profile tools run --rm seed
curl -fsS http://localhost:8080/healthz
curl -fsS http://localhost:3000/api/health/ready
```

For UI changes, verify the public invitation and admin workspace in the Browser
at desktop and mobile-representative widths. Exercise the affected form,
dialog, carousel, upload, moderation, or publishing flow.

## Production

- Keep provider-specific network topology, hostnames, registry configuration,
  and deployment credentials out of this public repository.
- Production requires PostgreSQL-compatible data storage, S3-compatible object
  storage, and an authenticated admin workspace behind a private access boundary.

## Git

- Work on a feature branch, not directly on `main`.
- Commit cohesive changes in small, reviewable units.
- Never commit secrets or real private wedding data.
