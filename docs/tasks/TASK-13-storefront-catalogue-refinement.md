# TASK-13 — Refine storefront typography, language navigation and catalogue

User request: improve the site's weak typography, modernise the language picker, publish the
11 prepared book covers in place of the poor legacy images, and bring the 100-book catalogue
up to the standard of a professional bookshop.

## Deliverables

- Replace the current type pairing with a more polished Hebrew-first family pair that also
  supports English and French, remains self-hosted through `next/font`, and preserves the
  existing type scale.
- Replace the plain locale links with a compact, accessible language menu using native language
  names and restrained flag cues. Give the mobile navigation the same visual language.
- Add a repeatable, fail-loudly import command that matches each prepared cover to its book by
  the exact legacy product URL recorded in the cover manifest. Publish all 11 prepared covers to
  the demo database and storage, detach the seven known `ramhal-cover-*` legacy images, and leave
  unrelated media untouched.
- Improve catalogue scanning with clearer filters, sort control, result range, richer card
  metadata and 20-book pagination. Filtering, sorting and pagination remain client-side because
  the complete catalogue is only 100 records and is already loaded for instant search.
- Keep Hebrew RTL-first, use logical CSS properties, and use the existing shadcn controls rather
  than raw form controls.

## Verification

- Add behaviour tests for catalogue sorting and pagination, including invalid/out-of-range pages.
- Prove the cover importer is idempotent and that all 11 target books point to prepared media;
  verify no book remains linked to a `ramhal-cover-*` legacy image.
- Run TypeScript, ESLint, Vitest and `next build` before committing.
- Visually inspect the deployed Hebrew and LTR catalogues at desktop and mobile widths.
- Write `docs/reports/TASK-13.md`, commit directly to `main`, and push `origin/main`.
