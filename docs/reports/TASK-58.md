# TASK-58 — "Look inside"

## Built
- **Admin:** `Books.previewPdf` (upload to Media, picker limited to PDFs), in the book's main tab under the gallery.
  Migration `20261103_182815_preview_pdf`.
- **Storefront:** `BookPreviewButton` — a button under the price that opens the PDF in a large dialog using the
  browser's own PDF viewer, with an "open in a new tab" link (phones show only the first page of an embedded PDF).
  `bookPreviewUrl` (`src/lib/bookPreview.ts`, tested) decides whether a book has a usable reading copy.
- **Haggadah:** the 69 page images of the fliphtml5 flipbook were downloaded and assembled into a 9 MB PDF
  (`~/Downloads/hagadah-shel-pesach-ramhal-preview.pdf`, under the 10 MB limit).
  `scripts/one-off/TASK-58-attach-book-preview-pdf.ts` attaches it.

## Verified
`tsc` clean, `eslint` 0 errors, `vitest` 443 passed (local test database migrated first), `next build` ok. Dialog and
the PDF viewer checked in a browser against the local database. Production: not yet run.

## Felt wrong
- Embedded native viewer: shows a download/print toolbar and no custom paging. A pdf.js reader would look better but
  needs a CORS `GET` rule on the R2 bucket (`infrastructure/r2/media-bucket-cors.json` allows only `PUT`).
- `db:restore-local` restores a backup that predates the latest migrations; both local databases need `db:migrate`.

## Still open
Production run of the one-off; the PDF viewer decision above.
