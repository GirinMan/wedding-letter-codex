# Wedding Letter Codex

## Purpose

Build and maintain a mobile wedding invitation whose content, behavior, and visual system can evolve independently.

## Source of truth

- `app/data/invitation.js`: wedding content and feature flags
- `app/design-systems/foundation.css`: replaceable visual tokens
- `app/styles/core.css`: structural layout and component behavior
- `app/scripts/`: rendering and interaction logic
- `_workspace/`: optional planning and QA artifacts; never required at runtime

Do not hard-code wedding details, account numbers, API keys, image URLs, or music URLs outside `app/data/invitation.js`.

## Required workflow

- Use `$build-wedding-invitation` for any request that creates, changes, or validates the invitation.
- Preserve the contract between content, core behavior, and the active design system.
- Treat aesthetic work as an optional layer. Do not generate or copy visual or audio assets unless the user asks.
- Keep the app dependency-free unless a requested feature clearly needs a dependency and the user approves it.
- Use semantic HTML, keyboard-accessible controls, and reduced-motion-safe behavior.

## Verification

Run these before handing off a change:

```bash
npm test
npm run validate
docker build -t wedding-letter-codex:test app
```

For UI-affecting changes, also exercise the primary flow at desktop and mobile widths in a browser.

## Git

- Work on a feature branch, not directly on `main`.
- Commit cohesive changes in small, reviewable units.
- Never commit secrets or real private wedding data to this public repository.
