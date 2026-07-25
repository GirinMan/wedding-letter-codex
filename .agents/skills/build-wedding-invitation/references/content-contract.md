# Invitation content contract

## Principles

- `app/data/invitation.js` is the only runtime source of wedding-specific facts.
- Unknown private data stays as a visible placeholder or an empty optional collection.
- Configuration must remain valid JavaScript data without DOM nodes, callbacks, or environment-specific secrets.
- The renderer hides optional empty sections instead of inventing content.

## Required shape

```js
{
  meta: { title, description, canonicalUrl },
  couple: {
    partner1: { name, label, phone },
    partner2: { name, label, phone }
  },
  event: {
    date, time, timezone, venueName, hall, address,
    mapUrl, latitude, longitude
  },
  copy: { headline, greeting, closing },
  hosts: [{ side, relationship, name, phone }],
  accounts: [{ side, owner, bank, number, holder }],
  gallery: [{ src, alt, width, height }],
  rsvp: { enabled, url, deadline },
  music: { enabled, src, title },
  features: { countdown, contacts, accounts, gallery, rsvp, share, music }
}
```

## Validation rules

- Use ISO `YYYY-MM-DD` for `event.date` and `HH:mm` for `event.time`.
- Use an IANA timezone such as `Asia/Seoul`.
- Give every gallery item meaningful Korean `alt` text and intrinsic dimensions.
- Store account numbers as display strings; derive clipboard values at runtime.
- Use `https:` URLs in production. Empty optional URLs are valid when their feature is disabled.
- `music.enabled` requires a non-empty `music.src`.
- `rsvp.enabled` requires a non-empty `rsvp.url`.
- Do not commit API keys. External SDK integration belongs in a separate adapter and environment configuration.

## Placeholder policy

Use bracketed values such as `[신랑 이름]`, `[예식장 이름]`, or `[계좌번호]`. The validator reports them but does not fail the starter configuration. Before production deployment, placeholders must be reviewed explicitly.
