# Invitation content contract

## Runtime authority

PostgreSQL is the runtime source of truth. The API validates every content and
design write with the schemas in `apps/api/src/domain/invitation.ts`.

`sampleInvitationContent` is only a generic bootstrap document. Real wedding
data is entered through the admin interface or a private deployment seed.

## Editable content

- couple labels and names
- hero, greeting, interview, timeline, closing copy
- contacts and family roles
- event timestamp, IANA timezone, venue, coordinates, and transport
- ordered section flags
- gallery/media references
- RSVP and guestbook configuration
- account groups and payment deep links
- guest-photo availability and music references

## Operational records

RSVP, guestbook, media metadata, guest uploads, sessions, and audit events use
normalized tables. Do not put these records into the invitation JSON document.

## Validation

- Store timestamps as offset-aware ISO strings and include an IANA timezone.
- Every media reference has a nullable UUID plus useful alt text.
- An enabled music item requires a published audio asset before use.
- Account and contact strings must be non-empty when their groups are shown.
- Reject unknown fields, oversize text, active HTML/SVG uploads, and invalid
  external URLs.
- Public responses omit password verifiers, sessions, audit events, moderation
  internals, and unpublished content.

## Privacy

- Commit only generic names, phone numbers, addresses, and account numbers.
- Never log or return password verifiers, session tokens, DB URLs, or MinIO keys.
- Production credentials live in the private IaC runtime `.env`.
- Publishing is an explicit transaction from validated draft to public revision.
