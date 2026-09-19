# TASK-10 — Book-cover source assets

## What was built

- Versioned `assets/book-covers/` with 51 unedited originals, a source manifest and
  usage documentation. Original legacy filenames retained; paths are repo-relative.
- Manifest includes book titles/IDs, product and image URLs, catalogue page,
  dimensions, file sizes and SHA-256 checksums.
- The three separately supplied files matched existing originals exactly; no duplicates.
- Temporary HTML, ZIP and review gallery remain outside the source archive in ignored output.

## What was verified and how

- Every copied image decoded with Sharp, matched its recorded dimensions, and was
  byte-for-byte equal to the downloaded source; checksums recorded for later verification.
- `tsc --noEmit`: passed. `eslint`: passed with 18 existing migration warnings.
- `vitest`: 21 files / 132 tests passed. Initial sandbox run could not resolve the
  database host; rerun with network access passed.
- `next build`: passed, 410 static pages generated.

## What felt wrong

- Eleven sources are under 400 pixels high; retaining them does not approve their
  quality for publication. The original scrape directory was ignored and unsuitable
  as the only durable home for these assets.

## What is still open

- Cover cleanup, consistent presentation and replacement of weak sources.
- Importing approved derivatives into Payload Media. No CMS or frontend changes here.
- Collection covers the linked Hebrew category, not all language catalogues.
