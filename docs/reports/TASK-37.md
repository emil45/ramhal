# TASK-37 — Press coverage archive

## What was built

- Added a localized `/press` archive and linked it from desktop, mobile, and footer navigation.
- Curated the five supplied sources newest-first, preserving original Hebrew headlines and adding
  localized summaries, topics, dates, metadata, and external-link labels.
- Built an editorial lead-story treatment and responsive article archive with shadcn `Badge`,
  `Card`, `AspectRatio`, and button variants.
- Reused institute-owned photography rather than copying publisher-owned thumbnails.

## What was verified and how

- Verified every title, publication date, outlet, and destination against the supplied live URL.
- Visually checked `/press`, `/en/press`, and `/fr/press` in a browser at desktop and 390px mobile
  widths. Hebrew is RTL; English and French are LTR; original Hebrew headlines remain RTL; no
  horizontal overflow was present.
- `npx tsc --noEmit`, `npx eslint`, `npx vitest run`, and `npm run build` passed. ESLint retains 30
  pre-existing generated-migration warnings and no errors.
- Storefront native-control and physical-direction utility greps returned no violations.

## What felt wrong

- The supplied Makor Rishon and Arutz 7 pieces are broad features in which the Rav appears, not
  profiles devoted entirely to the institute. The card summaries state that scope plainly.
- Local development reports the repository's existing PostgreSQL SSL-mode deprecation warning; it
  is unrelated to this page.

## What is still open

- The archive is curated in code. A Payload collection can replace it if press links need frequent
  non-developer editing; that workflow was outside this task.
