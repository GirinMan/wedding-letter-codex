# Reference audit

This document records the observable product behavior of the reference invitation
without copying its private data, original media, access credentials, or
service-specific source code.

## Public invitation surface

The reference is a narrow, mobile-first invitation canvas centered on a neutral
desktop background. Its information architecture is:

1. Hero with title, couple names, date, time, and venue
2. Invitation greeting, editorial portrait, family relationships, and contact CTA
3. Couple interview teaser cards and a full-screen Q&A dialog
4. Calendar, selected wedding date, and days/hours/minutes/seconds countdown
5. Relationship timeline carousel
6. RSVP CTA and form dialog
7. Venue, address, map, navigation links, and transport details
8. Two-column gallery with an initial limit and inline "show more"
9. Guestbook preview, entry form, and list dialog
10. Decorative middle photograph and D-day label
11. Gift account tabs, swipeable cards, and copy actions
12. Event-day guest photo upload
13. Closing photograph and share action

A circular music toggle remains visible while scrolling. Secondary floating
actions provide quick navigation and sharing.

## Interaction inventory

| Feature | Observed behavior | Initial implementation |
|---|---|---|
| Contact | Full-height dialog grouped by partner and parent, phone/SMS actions | Same grouping and accessible dialog |
| Interview | Full-height Q&A dialog | DB-managed entries and accessible dialog |
| Calendar | Selected wedding day and live countdown | Timezone-aware countdown |
| Timeline | Inline five-item carousel with previous/next controls | DB-managed, keyboard-operable carousel |
| RSVP | Attendance, side, phone, party size, meal, bus, short note, privacy consent | Persisted submission and admin export |
| Map | Embedded map, sketch-map dialog, external navigation apps | OpenStreetMap embed, admin-managed MinIO sketch map, and universal external links |
| Gallery | Two-column square grid; "show more" expands the list | DB/MinIO media slots with initial-limit control and publish state |
| Guestbook | Public list, name/message/password write flow, password delete flow | Moderated list and verified password-based author delete |
| Accounts | Partner tabs, swipeable account cards, copy and payment deep links | Encrypted-at-rest deployment option; masked admin list |
| Guest uploads | Disabled until configured time, then upload flow | MinIO upload with moderation and event-time gate |
| Music | Persistent toggle; reference attempts autoplay | User-initiated playback only |
| Sharing | Native/service share action and floating section drawer | Data-driven section drawer plus Web Share with clipboard fallback; optional Kakao adapter |

Read-only interaction checks confirmed that these primary actions open modal
surfaces without navigating away from the invitation:

- Contact separates both families and exposes the partner, father, and mother
  rows with distinct phone and SMS actions.
- Interview presents an ordered question-and-answer document in a full-height
  modal.
- RSVP asks for attendance, name, partner side, representative phone, additional
  guest count, meal, shuttle, a 30-character note, and explicit privacy consent
  before submission.
- Guestbook entry and listing remain separate actions; no form was submitted
  during the audit.
- The venue sketch-map action opens a dedicated image popup over the invitation.
- The floating action opens a drawer with section shortcuts, RSVP/photo actions,
  reminder, link-copy, and Kakao sharing entries.
- Gallery tiles expose pointer styling, but an individual-tile click did not open
  another visible surface in the inspected desktop state; list expansion remains
  the confirmed gallery interaction.

## Visual system inventory

- Paper-like white canvas with black ink and warm gray secondary text
- High-contrast editorial serif for English display copy
- Quiet Korean body typography with generous line height
- Fine one-pixel rules, subtle warm-gray surfaces, and approximately 10px radii
- Large vertical whitespace and restrained blush accent color
- Editorial portraits, square gallery crops, and a wave/arch closing image mask
- Sparse icons, almost no shadows, and no decorative gradients

Proposed token baseline:

| Token | Value |
|---|---|
| Paper | `#fbfaf7` |
| Ink | `#171717` |
| Muted | `#8b8178` |
| Rule | `#e8e3dd` |
| Blush | `#d9a6a0` |
| Radius | `10px` |
| Spacing | `8 / 16 / 24 / 32 / 48px` |

The accepted implementation concept is
[`docs/concepts/wedding-platform-concept.png`](concepts/wedding-platform-concept.png).

## Motion inventory

- Sections enter with a short fade-up as they cross the viewport.
- Editorial media alternates subtle slide-left and slide-right reveals.
- Countdown numbers update without moving surrounding layout.
- Timeline and account cards use horizontal track movement.
- The closing photograph is revealed through a static wave mask.
- Dialogs use opacity plus a short vertical transition.

All motion must honor `prefers-reduced-motion`. Scroll reveals must leave content
visible if JavaScript or `IntersectionObserver` is unavailable.

## Required application API

These are the APIs our independent implementation needs. They are not a copy of
the reference service's private API.

### Public

- `GET /api/public/invitations/:slug`
- `GET /api/public/invitations/:slug/guestbook`
- `POST /api/public/invitations/:slug/guestbook`
- `DELETE /api/public/invitations/:slug/guestbook/:entryId`
- `POST /api/public/invitations/:slug/rsvps`
- `POST /api/public/invitations/:slug/guest-uploads`
- `GET /api/media/:assetId/content`
- `GET /api/health/live`
- `GET /api/health/ready`

### Admin

- `POST /api/admin/session`
- `DELETE /api/admin/session`
- `GET /api/admin/session`
- `GET /api/admin/invitations/:id`
- `GET /api/admin/invitations/:id/preview`
- `PUT /api/admin/invitations/:id/content`
- `PUT /api/admin/invitations/:id/design`
- `POST /api/admin/invitations/:id/publish`
- `GET /api/admin/invitations/:id/media`
- `POST /api/admin/invitations/:id/media`
- `PATCH /api/admin/invitations/:id/media/:assetId`
- `DELETE /api/admin/invitations/:id/media/:assetId`
- `GET /api/admin/media/:assetId/content`
- `GET /api/admin/invitations/:id/rsvps`
- `GET /api/admin/invitations/:id/rsvps.csv`
- `GET /api/admin/invitations/:id/guestbook`
- `PATCH /api/admin/invitations/:id/guestbook/:entryId`
- `GET /api/admin/invitations/:id/guest-uploads`
- `PATCH /api/admin/invitations/:id/guest-uploads/:uploadId`
- `GET /api/admin/guest-uploads/:uploadId/content`

## Optional external integrations

| Integration | Purpose | Required for local development |
|---|---|---|
| Naver Maps JS | Embedded venue map | No |
| Naver/Kakao/Tmap deep links | Navigation | No API credential |
| Kakao JavaScript SDK | Native Kakao share | No |
| Web Share API | System share sheet | Browser capability |
| S3-compatible API | Media and guest uploads | Yes; MinIO locally |

## Intentional differences

- The app does not attempt music autoplay; playback requires an explicit user
  gesture.
- No original photos, audio, service logos, personal data, or exact private copy
  are imported.
- Maps and Kakao sharing are adapters with usable fallbacks, so the invitation
  remains functional without third-party keys.
- Administrative actions require an authenticated session even though the
  production admin hostname is also restricted to Tailscale.
- The admin workspace provides a same-origin, authenticated live draft preview.
  Unsaved edits update the embedded invitation immediately without changing the
  separately served public revision.
