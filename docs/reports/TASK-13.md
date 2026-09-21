# TASK-13 — Storefront catalogue refinement

## What was built

- Replaced Frank Ruhl Libre / Heebo with Noto Serif Hebrew / Assistant, self-hosted through
  `next/font` with Hebrew, Latin and extended-Latin coverage.
- Replaced the three bare locale links with a compact language menu using native names,
  decorative flags, a visible active state and matching mobile-sheet choices.
- Added instant title/price sorting, a visible result range, 20-book pagination and quieter,
  non-duplicative card metadata to the existing search/category/language catalogue controls.
- Added tested pure catalogue sorting and pagination rules under `src/lib/`.
- Added the repeatable `import:prepared-covers` command. It matches the 11 TASK-11 assets by
  exact audited legacy product URL, reuses existing prepared media, and only removes old media
  carrying the importer's `ramhal-cover-*` filename signature.
- Committed Payload's generated S3 client-upload import-map entry so future admin uploads use
  the deployed direct-to-storage path configured in TASK-12.

## What was verified and how

- Demo data: first cover run created and attached all 11 prepared media records, detached the
  six other books carrying legacy covers, and deleted all seven legacy media records. The repeat
  run reported 11 reused, zero created, zero attached and zero deleted.
- Database/storage: 11 books point to 11 prepared media records; zero books and zero media records
  use a `ramhal-cover-*` filename. Neon Object Storage contains each lossless source PNG and its
  generated 400 × 500 derivative.
- Behaviour: Vitest covers default/title/price ordering, missing-price placement, source-array
  immutability, normal and empty pages, stale page clamping and invalid page sizes.
- Gate: `tsc --noEmit`, ESLint (zero errors; 18 existing generated-migration warnings), Vitest
  (27 files, 184 tests), and `next build` (325 static pages) passed.
- Visual QA: inspected Hebrew RTL and English LTR catalogues on desktop and 390 × 844 mobile
  viewports. Checked the desktop locale menu, mobile navigation, filters, metadata, pagination,
  and the prepared `דברות` cover series.
- Vercel: production deployment `dpl_Df8u4WTCrNHM3xBDACWAq46Q46fU` completed successfully and is
  aliased at <https://ramhal-theta.vercel.app>. The live Hebrew prepared covers and the live
  English desktop/mobile layouts were visually verified.

## What felt wrong

- The legacy catalogue still contains near-duplicate editions/listings (the `דברות` search shows
  16 records for an eight-volume series). This task matched covers only to the exact audited
  products and did not merge commercial records without an editorial decision.
- Payload generated only one 400 × 500 derivative for these already-small prepared sources;
  larger configured sizes correctly were not upscaled. The storefront falls back to the source
  URL when the `card` size is absent.

## Still open

- Editorially review and merge or retire the legacy near-duplicate catalogue records; this needs
  a product-owner decision because several carry different prices or locale provenance.
- Revoke the branch-scoped Neon catalogue-import credential after all remaining catalogue media
  work is complete.
