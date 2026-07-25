# Invitation QA checklist

## Data integrity

- Compare rendered names, date, time, venue, address, hosts, and account ownership with `app/data/invitation.js`.
- Report all bracketed placeholders.
- Confirm disabled or empty optional features do not render empty sections.
- Confirm no secret, private key, or unintended real personal data is committed.

## Core interactions

- D-day state covers upcoming, today, and past events.
- Venue and telephone links use valid schemes.
- Account copy strips presentation-only whitespace and reports success or fallback.
- Share uses Web Share when available and clipboard fallback otherwise.
- Gallery opens, changes items, closes with the close control, backdrop, and Escape.
- Music never autoplays and is absent when disabled.
- RSVP is absent unless enabled with a URL.

## Accessibility

- Landmarks and heading levels are logical.
- Buttons have accessible names and visible focus.
- Dialog focus is contained or restored predictably.
- Status messages use a polite live region.
- Gallery images have useful alt text and intrinsic dimensions.
- Reduced-motion preferences disable non-essential transitions.

## Responsive and deployment

- No horizontal overflow at 320px, 375px, 768px, and desktop widths.
- Tap targets remain usable and important text does not clip.
- All local assets resolve with case-sensitive paths.
- `npm test`, `npm run validate`, and the Docker build pass.
- `/healthz` responds successfully in the container.
