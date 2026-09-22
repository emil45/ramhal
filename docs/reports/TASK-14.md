# TASK-14 — Beit Ramhal page

## What was built

- Added a dedicated, image-led Beit Ramhal page in Hebrew, English and French, with localized
  metadata and a responsive RTL-first editorial layout.
- Reworked the legacy copy into separate beit midrash and synagogue narratives, a study-subject
  panel, building-use cards, historical statistics and a link to the live site schedule.
- Presents the kollel, attendance and Padua-replica details directly in the institute's own voice,
  without exposing migration notes or third-person attribution to visitors.
- Added Beit Ramhal to the desktop header, mobile sheet and footer navigation in all locales.
- Produced ten web-ready WebP derivatives from all supplied source photographs: a 16:9 teaching
  hero, sanctuary, exterior and ark, plus six gallery images. Together they weigh about 1.6 MB.
- Added a responsive shadcn/Embla carousel with localized captions and controls, touch and keyboard
  navigation, locale-aware direction, looping, and one, two or three visible images by breakpoint.

## What was verified and how

- Gate: `next typegen`, `tsc --noEmit`, ESLint (zero errors; 18 existing generated-migration
  warnings), Vitest (27 files, 184 tests), and `next build` (331 static pages) passed.
- Convention scans: no raw inputs, selects or buttons under the storefront/frontend paths, and no
  physical left/right spacing utilities in the touched layout files.
- Visual QA: inspected Hebrew RTL and English LTR at 1269 px desktop and 390 × 844 mobile widths.
  Checked navigation fit, hero cropping, statistic wrapping, card stacking, image loading, carousel
  direction and controls, and the closing gallery.
- Accessibility surface: the page exposes one h1, ordered h2 sections, descriptive image text,
  a real list for subjects, a labelled carousel with localized controls, and a named schedule link.

## What felt wrong

- The supplied attendance figures are retained as institutional copy without adding editorial
  caveats that would sound out of place on the institute's own website.
- The supplied exterior photograph is visibly older and softer than the recent teaching image;
  careful sizing keeps it useful without asking it to carry the hero.

## Still open

- Confirm and publish current kollel enrolment, class attendance and visiting hours when the
  institute can provide them.
