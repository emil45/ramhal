# TASK-11 — Prepared catalogue covers

## What was built

- **11 finished catalogue candidates** in `assets/book-covers/prepared/`: eight
  individual דברות הרמח״ל volumes, זוהר השלם, רבי יעקב מולכו and מחול לצדיקים.
- Transparent, lossless PNGs, 400 × 500 pixels, with each visible book 420 pixels
  high and aligned at y=460. Proportions, perspective, colours and lettering retained.
- Removed surrounding backgrounds/source shadows, the עם ישראל rectangle, and
  the מחול לצדיקים reflection. Isolated the Zohar book and ribbons from its rear box.
- `prepared/manifest.json` maps output names to titles, legacy IDs, source files,
  checksums and processing dimensions. Other collected covers are archive-only.
- Reproducible Sharp workflow: `node scripts/prepare-book-covers.mjs`, driven by
  individually traced silhouettes in `assets/book-covers/preparation.json`.
- [Before/after gallery](TASK-11-preview.html) and [selected-cover overview](TASK-11-covers.png).

## What was verified and how

- All 51 original checksums unchanged; all 11 output checksums and dimensions checked.
- All outputs decode, have transparent margins, share the 420-pixel book height and
  baseline, and use no upscaling. A second preparation run produced identical hashes.
- All 11 reviewed together against warm paper; difficult edges checked separately.
- Browser gallery loaded all 22 before/after images successfully.
- `tsc --noEmit`: passed. `eslint`: passed, 18 pre-existing migration warnings.
- `vitest`: 24 files / 167 tests passed. `next build`: passed.

## What felt wrong

- A generative edit tried earlier changed artwork details despite preservation
  instructions. It was rejected and is not included in any prepared asset.
- Website sources cannot supply high-resolution zoom. The 400 × 500 files are
  intended for catalogue use (approximately 200 × 250 CSS pixels at 2×).
- Masks are specific to these source files; a replacement source needs a new trace.

## What is still open

- User's visual review and importing selected files into Payload Media. No storefront
  components or CMS records were changed by this task.
- Confirm edition/product matching during import: legacy IDs are not Payload IDs.
- Whether the Zohar box belongs in a secondary product image; its inclusion in the
  purchase has not been verified. The unedited source retains it.

## Handoff to the next agent

Use `assets/book-covers/prepared/` for the 11 selected catalogue covers, not the
51-image source archive. Read its manifest for the product mapping. These are
transparent PNGs with standard margins: use contain sizing, preserve alpha and
do not auto-trim, stretch or crop to fill. The current storefront's 2:3 frame can
contain the 4:5 asset canvas without changing the component ratio. Files are not
zoom masters. Import them into Payload Media only after matching the correct
book/edition, and preserve `originals/`. The approved processing method here is
deterministic Sharp masking/cropping/downsampling; do not redraw Hebrew lettering
with generative tools. No weaker source covers are part of the prepared set.
