# TASK-55 — Covers supplied as single image files

## Built
`scripts/one-off/TASK-55-set-book-cover-from-file.ts <urlSlug> <image> [replace]` sets one file as a book's cover,
one file per process, and reads the object back from the public URL. Run on production on 29 October 2026
(fingerprint `2c951382a7f8`, temporary R2 key revoked each time) for:
- Kabbalah du Arizal (French, book 18) — scan, 468×700.
- אור עולם (book 3) — scan, 468×640.
- שוד מלכים (book 36) — a photo of the book, cut out and set on the paper colour (425×700 source, so small).
All three stored as WebP at their own size, not enlarged.

## Verified
Each file and its thumbnail answered on the public URL before the book was linked; live pages checked after the deploy.

## Felt wrong
The chat client delivered the same image for several pasted messages (identical checksums), so the Pesach image
and the other books waited for a re-send.

## Still open
The straight cover for גילוי מלכותו על פסח (book 65, which has an angled photo) has not arrived. Two photos still wait
for a book (`docs/BACKLOG.md`). The scans are low resolution and look soft in the enlarged view.
