# TASK-18 — Surface complete book courses

User request: make the institute's complete YouTube walkthroughs of Ramhal books discoverable,
with a direct path to the first lesson and a useful connection to the matching store edition.

## Deliverables

- Add a locale-aware `/courses` page for Hebrew, English and French.
- Curate only complete, book-length courses from the institute's own YouTube playlists; link both
  to the first lesson and to the full playlist.
- Pair each course with the best matching catalogue edition for the current locale when one exists.
- Add the reciprocal course callout to every matching book detail page.
- Add the page to desktop, mobile and footer navigation.
- Keep the page light: no embedded players, no YouTube metadata request during page rendering, and
  no dependence on the future full media-sync task.
- Stay inside the printed-sefer storefront system: warm paper, teal actions, gold rules, serif
  headings, restrained shadcn components, RTL-first logical properties and no raw controls.

## Verification

- Unit-test course URLs and book/course matching.
- Run TypeScript, ESLint, Vitest and `next build`.
- Run the raw-control and physical-direction grep gates from `AGENTS.md`.
- Visually inspect Hebrew RTL and English LTR at desktop and mobile widths.
- Write `docs/reports/TASK-18.md`, commit directly to `main`, and push `origin/main`.
