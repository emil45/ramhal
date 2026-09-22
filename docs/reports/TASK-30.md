# TASK-30 — Deployed homepage flyer verification

Brief: `docs/tasks/TASK-30-verify-news-flyer.md`.

## What was built

- No application change was needed. The editor uploaded the prepared WebP through Payload Admin
  and the announcement now points to the stored object.
- Reverted an unexecuted one-off repair proposal before publication because the editor's upload
  had already resolved the missing file.

## What was verified and how

- Before the editor upload, the live homepage referenced the original flyer filename but its
  `/api/media/file/` URL returned HTTP 500. The file existed only in the local ignored `media/`
  directory.
- After the editor upload, the running demo homepage references the new object in Neon Object
  Storage. The object returns HTTP 200 with `image/webp`; the homepage's Next image URL returns
  HTTP 200 with an image response.
- The browser reports `complete: true` and nonzero natural dimensions for the homepage image.
  At a 390×844 viewport it decodes and renders at 287×406 without cropping.
- No one-off script was run against the deployed database or object store.

## What felt wrong

- TASK-29's local Payload upload was reported as though it proved the deployed upload path. The
  local process shared database metadata with the demo but had no S3 storage variables, so the
  live page could see the Media row without seeing the file bytes. A live image URL check would
  have exposed the mismatch immediately.

## What is still open

- The new Media record currently has no localized alternative text; the card falls back to the
  announcement title. An editor can set descriptive alt text in each locale in Payload Admin.
