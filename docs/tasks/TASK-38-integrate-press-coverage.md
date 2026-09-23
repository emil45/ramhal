# TASK-38 — Integrate press coverage into the Rabbi Chriqui page

## Why

The five curated press links are primarily evidence of Rabbi Mordechai Chriqui's public work. A
separate page and top-level navigation item overstate a small archive and separate that evidence
from the biography it supports.

## Scope

- Move the press presentation into the Rabbi Chriqui page, after the biography and before the
  filmed interview.
- Keep the interview section visually and structurally unchanged.
- Present one featured article followed by four supporting cards, without introducing another hero
  image or competing with the page's existing portrait and video.
- Remove the Press item from desktop, mobile, and footer navigation.
- Permanently redirect the existing localized `/press` routes to the Rabbi Chriqui press-section
  anchor so already-shared links remain useful.
- Preserve the localized framing and original Hebrew article headlines from TASK-37.

## Verification

- `npx tsc --noEmit`, `npx eslint`, `npx vitest run`, and `npm run build` pass.
- Check Hebrew RTL and English/French LTR layouts at desktop and 390px mobile widths.
- Confirm `/press`, `/en/press`, and `/fr/press` redirect to the matching Rabbi page and anchor.
- Confirm the video block's markup and classes are unchanged.
- Finish with `docs/reports/TASK-38.md`.
