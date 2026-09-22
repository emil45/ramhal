# TASK-17 — Enrich the Rabbi Chriqui page

## What was built

- Reworked the Hebrew, English and French Rabbi Chriqui pages into a full editorial profile with
  a prominent portrait hero, concise introduction and dedicated biography section.
- Added the Kan Moreshet interview “שמישהו יעצור אותי” as a responsive, privacy-enhanced YouTube
  embed with lazy loading and locale-specific accessible titles.
- Added the supplied Hanukkah photograph beside the interview with translated alternative text and
  captions.
- Replaced the small legacy portrait with the supplied high-resolution photograph and increased its
  desktop presence while keeping the mobile composition contained.
- Used FFmpeg to correct EXIF orientation, resize and encode both photographs as WebP. Organised the
  photographs under `public/rabbi-chriqui/` and moved the loose anniversary emblem to `public/brand/`.
- Added locale-specific search metadata.

## What was verified and how

- `npx tsc --noEmit`: clean.
- `npm run lint`: passed with 18 pre-existing unused-parameter warnings in generated migration
  files and no errors; ESLint for the changed route was clean.
- `npm test`: 27 files and 184 tests passed.
- `APP_ENV=development npm run build`: production build passed and all three locale variants were
  statically generated.
- Raw-control and physical-direction grep gates: clean.
- Browser inspection at desktop width confirmed the larger hero image, editorial hierarchy and
  media composition. Inspection at 390 px confirmed a 375 px document inside a 390 px viewport,
  with no horizontal overflow.
- Browser inspection confirmed Hebrew renders RTL and English/French render LTR, with localized
  headings, document titles and iframe titles.

## What felt wrong

- YouTube's player remains an external surface whose visual chrome is controlled by YouTube. The
  surrounding frame and editorial context integrate it with the site without pretending that the
  player itself can match the design system.

## What is still open

- The page content is still code-backed. It should move into Payload if the institute needs to edit
  the biography, captions or featured interview through the admin interface.
