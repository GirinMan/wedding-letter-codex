# Invitation theme system

Themes are saved as part of `InvitationDesign`. The public invitation reads the
saved `themeId` for structural styling and the saved tokens for colors,
typography, spacing, radius, and motion. This keeps a theme selectable per
invitation while preserving token-level customization.

## Botanic Garden

The original invitation design, renamed to describe its actual visual language.
It uses ivory paper, soft rose, generous white space, rounded media, and a
restrained botanical garden tone. Stored `garden-editorial` ids are normalized
to `botanic-garden` when the design contract is parsed.

## Sicilian Noir

An original wedding catalog theme informed by the black fashion-show grid and
white navigation bar in the supplied Dolce & Gabbana commerce reference.

Observed design language:

- pure black and white as the interface system;
- geometric sans-serif typography for both headings and utility labels;
- square image frames, neutral rules, uppercase microcopy, and strict grids;
- photography as the dominant material, with interface elements kept quiet.

Project interpretation:

- palette: black `#000000`, white `#ffffff`, grey `#a3a3a3`, rule
  `#3a3a3a`, and surface `#0a0a0a`;
- type fallback: Avenir Next / Helvetica Neue / Arial / Pretendard /
  Noto Sans KR;
- signature: a compact white masthead followed by a three-image wedding
  catalog grid.

The project does not ship the brand's logo, proprietary FuturaLTPro or Walbaum
font files, campaign photography, generated ornamental artwork, or textile
artwork.
