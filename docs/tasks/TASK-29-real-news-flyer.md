# TASK-29 — Real news flyer asset and Payload upload path

## Why

TASK-28 deliberately left flyer verification open until Emanuel supplied a real institute
announcement. A real portrait flyer is now available and must be prepared without losing its
embedded Hebrew text, then exercised through the same Media relationship used by Payload Admin.

## Scope

- Preserve the exact received JPEG under `assets/news/originals/` with a descriptive name.
- Use local FFmpeg to make a metadata-free WebP under `assets/news/prepared/`, retaining the
  original 800×1131 dimensions and natural aspect ratio. Do not crop.
- Document why source assets belong under `assets/news/` and why neither `public/` nor a manual
  copy into `media/` is correct.
- Extend `seed:demo-news` to create or reuse the prepared flyer as a Payload Media record, set
  localized alternative text, and attach it to the matching new-machzor announcement.
- Keep the production refusal and the script's idempotent behaviour.

## Verification

- Compare dimensions, byte size, and full-size legibility against the received JPEG.
- Run `npm run seed:demo-news` twice and confirm that the second run reuses rather than duplicates
  the Media record.
- Verify through Payload that the Media record has generated sizes and localized alternative text.
- Check the real flyer on the Hebrew, English, and French homepages, including at 390px wide.
- Run the standard typecheck, lint, tests, and production build before committing.
- Finish with `docs/reports/TASK-29.md`.
