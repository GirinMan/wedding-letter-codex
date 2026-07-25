# Design-system contract

## Swap boundary

The `InvitationDesign` document in PostgreSQL controls the public visual
language. `apps/public-web/src/App.tsx` maps those values to semantic CSS custom
properties; structural CSS consumes the properties without knowing the theme
name.

## Required tokens

- `colors.paper`
- `colors.ink`
- `colors.muted`
- `colors.line`
- `colors.accent`
- `colors.surface`
- `typography.display`
- `typography.body`
- `radius`
- `spacing.section`
- `spacing.content`
- `motion.reveal`
- `motion.durationMs`

## Ownership

Public structure owns section order rendering, responsive mechanics, dialogs,
forms, focus behavior, and progressive enhancement.

The design document owns color, typography, spacing character, radius, and
motion timing.

Content owns media references and copy. CSS must not hard-code production media
URLs.

The admin app owns token editing and live preview, not an independent theme.

## Replacement check

1. Saving design tokens requires no API or component rewrite.
2. All token values validate and resolve to CSS properties.
3. Text contrast and focus indication remain visible.
4. The public invitation works without any uploaded image or audio.
5. The mobile page has no horizontal overflow from 320px upward.
6. `prefers-reduced-motion` makes all essential content immediately visible.
