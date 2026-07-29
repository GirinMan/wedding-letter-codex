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

An original wedding catalog theme informed by the black fashion-show framing,
sunlit limestone surfaces, saturated tableware, and floral color in the
supplied Dolce & Gabbana commerce reference.

Observed design language:

- black and warm white as the interface system;
- geometric sans-serif typography for both headings and utility labels;
- square image frames, uppercase microcopy, and strict image grids;
- saturated cobalt, lemon, terracotta, and bougainvillea used as focal color;
- photography and generous limestone-toned space instead of repeated rules.

Project interpretation:

- base palette: limestone `#f7f1e7`, nero `#080808`, ink `#171412`,
  terracotta `#b94125`, and sand `#efe3d2`;
- signature palette: cobalt `#21558a`, lemon `#e5b927`, terracotta
  `#b94125`, and bougainvillea `#963c61`;
- type fallback: Avenir Next / Helvetica Neue / Arial / Pretendard /
  Noto Sans KR;
- signature: a compact black masthead, a single majolica tile ribbon, and a
  three-image wedding catalog grid;
- black is reserved for structural anchors such as the hero details, story
  section, closing, and primary actions rather than covering every section;
- the bundled Image Gen artwork `sicilian-wedding-paper-festa.jpg` supplies a
  sunlit handmade-paper, olive, lemon-blossom, black-ribbon, bougainvillea,
  and restrained multicolor majolica composition; coordinated crops form the
  hero triptych, profile and interview portraits, story image, gallery contact
  sheet, middle image, and closing while those media slots are empty;
- empty media never exposes internal placeholder labels or abstract wireframe
  shapes, so the invitation reads as a finished paper composition before
  photos are uploaded;
- uploaded media always replaces the bundled fallback artwork.

The project does not ship the brand's logo, proprietary FuturaLTPro or Walbaum
font files, campaign photography, or copied textile artwork. The bundled
fallback photograph is original, unbranded generated artwork created for this
project.
