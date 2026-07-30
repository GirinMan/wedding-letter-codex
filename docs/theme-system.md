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

An original wedding catalog theme built around a strict black-and-white
interface and one photographic pause inspired by Sicilian architecture.

Observed design language:

- pure white and near-black as the interface system;
- geometric sans-serif typography for both headings and utility labels;
- square image frames, uppercase microcopy, and strict image grids;
- neutral gray empty-photo surfaces without decorative wireframes;
- Sicilian color appears only inside the middle architectural transition.

Project interpretation:

- base palette: paper `#ffffff`, nero `#0a0a0a`, muted gray `#6f6f6f`,
  line `#dedede`, and surface `#f4f4f4`;
- type fallback: Avenir Next / Helvetica Neue / Arial / Pretendard /
  Noto Sans KR;
- signature: a compact black masthead, a strict three-image wedding catalog
  grid, one full-bleed Sicilian architecture transition, and small repeated
  ceramic details;
- black is reserved for structural anchors such as the hero details, story
  section, closing, and primary actions rather than covering every section;
- the bundled Image Gen artwork `sicilian-courtyard-transition.webp` shows a
  white limewashed wall, black volcanic-stone arch, and a narrow cobalt
  majolica edge with restrained red, yellow, and green accents; it is used only
  behind the middle D-Day transition;
- three additional Image Gen assets extend that color language without
  becoming photo substitutes: `sicilian-majolica-frieze.webp` forms the hero
  and closing borders, the transparent `sicilian-star-medallion.png` marks
  section labels on both white and black surfaces, and
  `sicilian-margin-inlay.webp` appears as a full-height tile bookmark in
  selected white margins;
- hero, greeting, profile, interview, timeline, gallery, and closing photo
  slots stay neutral grayscale until real photos are uploaded;
- empty media never exposes internal placeholder labels or abstract wireframe
  shapes.

The project does not ship the brand's logo, proprietary FuturaLTPro or Walbaum
font files, campaign photography, or copied textile artwork. The bundled
transition photograph is original, unbranded generated artwork created for
this project.
