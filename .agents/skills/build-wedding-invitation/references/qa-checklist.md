# Invitation QA checklist

## Data and persistence

- Domain schema tests pass.
- Clean PostgreSQL migrations succeed and are idempotent at container restart.
- The generic seed is idempotent and does not overwrite an existing invitation.
- Draft edits stay private until publish.
- No real private data or secrets are tracked by git.

## Public interactions

- Invitation fetch, headings, and ordered sections render.
- Countdown is timezone-aware and layout-stable.
- Contact, interview, RSVP, and guestbook dialogs open and close accessibly.
- Timeline and account tabs respond by keyboard and pointer.
- Account copy and sharing report success or fallback.
- Gallery expansion is inline and stable.
- Music never autoplays.
- Guest uploads stay disabled until the configured timestamp.

## Admin interactions

- Unauthenticated requests receive `401`.
- Login sets a Secure, HttpOnly, SameSite=Strict production cookie.
- Content and design saves validate.
- Media uploads reach MinIO and previews remain authenticated.
- RSVP, guestbook, and guest-upload moderation round-trip.
- Publishing atomically updates the public revision.

## Accessibility and responsive behavior

- Landmarks and heading levels are logical.
- Controls have accessible names, visible focus, and usable tap targets.
- Dialog focus and Escape behavior are correct.
- Status messages use polite live regions.
- Images have useful alt text.
- Reduced motion disables non-essential transitions.
- Public UI has no horizontal overflow at 320, 375, 430, 768, and desktop.
- Admin editor remains usable at 900px and shows live preview at wide desktop.

## Runtime and deployment

- `npm run check` passes.
- Local Docker Compose and all three production images build.
- API readiness checks PostgreSQL and MinIO.
- Public and admin Nginx `/healthz` return `200`.
- Public NPM target is `wedding-invitation:80`.
- Admin NPM target is `wedding-admin:80` and DNS resolves only through Tailscale.
- Cloudflare Tunnel has no admin route.
