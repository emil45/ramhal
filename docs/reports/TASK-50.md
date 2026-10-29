# TASK-50 — Photographed covers and a book-page image gallery

## Built
- **Photos:** 20 HEIC originals (5712×4284) cut out with macOS Vision's foreground mask, levels stretched
  slightly, sharpened, set on `#F6EFE3` (the `paper-deep` token) with a soft shadow, saved as WebP at 1600px on
  the long side. No generative step, so no lettering is redrawn. 15 of them are ready for 9 books, in
  `~/Downloads/ramhal-covers/`; the processing tools lived in a session scratch folder and are not in the repo.
- **Gallery:** the `gallery` field already existed on Books. `collectBookImages` (`src/lib/bookImages.ts`, tested)
  orders cover then gallery, dropping duplicates and unloaded references. `BookImageGallery` shows the cover frame
  with a thumbnail strip under it when there is more than one picture; selecting a thumbnail swaps the frame. No
  lightbox, no autoplay. A book with one picture or none renders as before.
- **Upload:** `scripts/one-off/TASK-50-book-cover-photos.ts` creates the Media files and sets cover + gallery on
  nine books; a book that already has a cover is skipped.

## Verified
`tsc` clean; `eslint` 0 errors; `vitest` 398 passed; `next build` ok. The script ran against the local database
and the book page was checked in a browser: the cover fills the frame, thumbnails swap it, the selected one is
ringed. **Not run against production** — needs the owner's credentials.

## Felt wrong
- Another session committed this task's in-progress files inside `9068c8a` (a homepage fix) while this one was
  still working. Nothing lost, but the log does not describe that commit.
- The processing pipeline is not reproducible from the repo.

## Still open
- Run the script against production (command in its header), then save anything in the admin so the cached
  storefront refreshes. Tracked in `docs/BACKLOG.md`.
- Photos held back until the owner says which book they are: 2875 and 2877 (blue boxed set), 2928 (French
  "La métaphysique de l'unité chez le Ramhal"), 2915 (מחול לצדיקים, which already has a cover).
