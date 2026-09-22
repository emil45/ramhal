# TASK-33 — Enlarge the homepage logo on mobile

## What was built

- Increased the homepage masthead logo from `h-48` (192px) to `h-64` (256px) below the
  `md` breakpoint. The existing desktop height remains `h-80` (320px).
- Added an accurate responsive `sizes` hint for the Next.js image so the browser requests an
  appropriately sized source at both breakpoints.
- Left the compact header and footer logos unchanged.

## What was verified and how

- Rendered the real homepage at 422×764px: the logo renders at 181×256px and the visible artwork
  grows from roughly 132px to 170px while retaining balanced space above and below it.
- Rendered at 1024px wide: the desktop logo remains 226×320px.
- `tsc --noEmit` — clean.
- ESLint — 0 errors; 26 pre-existing warnings in generated migration files.
- Vitest — 45 files, 321 tests, all passing.
- `next build` — succeeds; all 327 static paths generated.
- Storefront native-control grep — clean.

## What felt wrong

- The first Vitest run exposed that the long-lived testing database had not received TASK-32's
  already-committed admin-facelift migration, so integration tests failed on missing
  `display_title` columns. Applied that one pending migration to the protected testing branch
  only, then reran the complete suite successfully. No application code change was needed.

## What is still open

- Nothing for this task.
