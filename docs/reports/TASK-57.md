# TASK-57 — The second photo shoot

## Built
- **Pipeline in the repo** (`scripts/book-photos/`): `cutout.swift` (macOS Vision foreground mask, no generative
  step), `compose.py` (levels stretch on the book only, light sharpening, soft shadow on `#F6EFE3`, 1600px WebP),
  `process.sh` (walks a manifest). TASK-50's tools were lost with its scratch folder; these are not.
- **Manifest** `scripts/one-off/TASK-57-book-photos.manifest`: 65 photos → 34 books. 28 books get a cover, the rest
  get gallery pictures. Books already shown with their own photographs from TASK-50/53 were left out (checked by
  eye against the existing covers: אדיר במרום, איגרות הרמח"ל, מלך העולם, tikoun olam, גילוי מלכותו ×3, white
  Yom Kippur set, the first two Zohar boxed-set shots, מחזור ר"ה's angled shot).
- **Attach scripts**: `TASK-57-attach-book-photo.ts` (one photo, one process, reads each R2 file back from its
  public URL) and `TASK-57-attach-book-photos.sh` (walks the manifest).

## Verified
Ran against the local database: 65 attached, covers 24 → 39 of 62 (local data is the 23 September backup), gallery
strip and thumbnails checked in a browser on the Haggadah book page. `tsc` and `eslint` clean on the new script.
Production: **not yet run** — needs the temporary Neon string and R2 key (`docs/RECOVERY.md`).

## Felt wrong
- The local database was seven migrations behind after `db:restore-local` (the backup predates them); the restore
  does not migrate.
- The tikunim-chadashim photo (IMG_2889) has a slight blue wall reflection on the spine edge.
- IMG_2873/2874 (7-volume boxed set) is attached to "סט ספרי הגאולה לרמח"ל" on the strength of the contents; the
  catalogue entry has no description to confirm it.

## Still open
Production run; photos with no matching book (in `docs/BACKLOG.md`).
