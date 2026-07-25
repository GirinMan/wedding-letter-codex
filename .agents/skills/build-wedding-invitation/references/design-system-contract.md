# Design-system contract

## Swap boundary

`app/index.html` loads exactly one file from `app/design-systems/` before `app/styles/core.css`. Replacing that stylesheet must be enough to change the visual language without changing content or interaction modules.

Core markup and styles may consume semantic custom properties, but must not depend on a theme filename.

## Required tokens

Every design system defines:

```css
--font-display
--font-body
--font-ui
--color-canvas
--color-surface
--color-text
--color-muted
--color-border
--color-accent
--color-accent-contrast
--color-focus
--space-section
--space-gutter
--content-width
--radius-control
--radius-media
--shadow-elevated
--duration-fast
--duration-base
--ease-standard
```

It may also define the optional hooks `--hero-media-overlay`, `--section-divider`, and `--background-texture`.

## Structural ownership

Core owns:

- semantic section order and landmarks
- responsive container mechanics
- visibility and feature-flag behavior
- focus states and accessible interaction geometry
- dialogs, copy/share feedback, and media controls

The design system owns:

- color palette and contrast-preserving combinations
- typography families, scale character, weights, and tracking
- spacing character within the permitted responsive bounds
- radii, borders, shadows, decorative backgrounds, and motion feel

Content owns image and audio file references. A design system may style their frames but must not hard-code asset URLs.

## Replacement check

After swapping a design system:

1. No core JavaScript changes should be required.
2. All required tokens must resolve.
3. Focus indication and text contrast must remain visible.
4. The page must work with every image and audio feature disabled.
5. Mobile widths from 320px upward must not overflow horizontally.
