# Selected, prepared book covers

Only the 11 selected covers belong here: the eight individual דברות הרמח״ל
volumes, זוהר השלם, רבי יעקב מולכו and מחול לצדיקים. Other collected images
are retained in the source archive, not included in this set.

## Treatment

- Transparent, lossless PNG; common 400 × 500 canvas.
- Each visible book is 420 pixels high, starts at y=40 and shares the y=460 baseline.
- Original proportions, perspective, colours, lettering and illustrations retained.
- Individually traced silhouettes remove the surrounding backgrounds and shadows.
- The עם ישראל background rectangle and מחול לצדיקים reflection are removed.
- זוהר השלם shows the foreground book and ribbons; the box behind it is omitted.
  This presentation makes no claim about whether the box is included in a purchase.
- No AI redrawing, colour replacement, sharpening or upscaling. Source images were
  masked, cropped, downsampled and placed on a common transparent canvas using Sharp.

## Integration

`manifest.json` maps descriptive filenames to Hebrew titles, legacy IDs and source
files, with source/output checksums and processing dimensions. Legacy IDs are not
Payload book IDs; verify the matching edition before importing.

Use contain sizing and preserve transparency. Do not crop to fill, stretch the book,
or remove the standard margins automatically. These files work on white or the
site's warm paper background. The storefront's 2:3 frame can contain these 4:5 assets;
the asset canvas does not change the frame's aspect ratio. No storefront changes
or CMS imports have been made as part of preparation.

These are catalogue assets, suited to roughly 200 × 250 CSS pixels on a 2× display.
They are not high-resolution zoom masters. The unchanged larger source files remain
in `../originals/`; new detail cannot be recovered from the website copies.

## Reproduction and review

From the repository root, run `node scripts/prepare-book-covers.mjs`. The script
checks source hashes before using `../preparation.json` and writes these outputs.
Masks are specific to the recorded files; retrace them if a source changes.

Visual comparison: `docs/reports/TASK-11-preview.html`.
Handoff report: `docs/reports/TASK-11.md`.
