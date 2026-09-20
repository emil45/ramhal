# Book-cover source assets

Unedited source images collected from the three pages of the Hebrew catalogue on
19 September 2026: 51 products and 51 images. These are the largest files exposed
by the checked catalogue/product album links, not the designer's production files.

## Layout

- `originals/`: original downloaded bytes, using the legacy image filenames.
- `manifest.json`: Hebrew title, legacy product ID and URL, catalogue page,
  image source URL, relative file path, dimensions, byte size and SHA-256 checksum.
- `prepared/`: the 11 selected, cleaned catalogue images and their source mapping.
- `preparation.json`: the selection, individually traced silhouettes and layout settings.

Filenames retain the legacy identifiers so a title correction does not rename an
asset. Use the manifest to find a book; do not infer identity from its filename.
The three separately supplied files for זוהר השלם, רבי יעקב מולכו and מחול לצדיקים
match the downloaded files byte-for-byte and are included once.

## How to use these files

Use `prepared/` for the current selected catalogue candidates; the other source
images are archival only. Keep originals unchanged. Import selected prepared files
into Payload's Media collection and associate them with the appropriate books when
ready to publish. This folder is not a public image endpoint or a replacement for
CMS-managed media.

Do not put scrape HTML, review galleries, ZIP bundles or CMS-generated thumbnails
in this folder. The initial scrape evidence remains in the ignored
`scripts/scrape/out/book-covers/` directory; committed visual reviews live under
`docs/reports/`. The source archive does not depend on the temporary scrape output.

## Quality and scope

- All eight דברות הרמח״ל volume images are 700 pixels high; usable for a modest
  catalogue display, limited for detailed zoom. The prepared copies normalise the
  margins and book height without enlarging or redrawing the source artwork.
- Eleven images are below 400 pixels high and need better sources before large display.
- Other images still need individual visual review. Pixel dimensions alone are not
  a quality verdict, and a set's promotional image is not necessarily a front cover.
- This collection covers the linked Hebrew category only, not all language categories.
- Inclusion here does not mean approved for publication. No CMS records were changed.

For a new source, preserve its bytes, add its product/source mapping and metadata to
the manifest, and retain an older source under its existing name when the files differ.

Regenerate the selected outputs with `node scripts/prepare-book-covers.mjs` from
the repository root. See `prepared/README.md` for the format and integration notes.
