# TASK-30 — Verify the homepage flyer on the deployed demo

## Why

The TASK-29 flyer appeared as a broken image on the deployed homepage. Its Media row had been
created from a local development process, which wrote file bytes to ignored local `media/` even
though the demo reads files from Neon Object Storage. The editor has since uploaded the prepared
WebP through Payload Admin.

## Scope

- Check the live homepage and the Media URL reported by that running deployment.
- Confirm that the original storage object and the Next image variant return image responses.
- Confirm in a browser that the homepage image decodes at desktop and mobile width.
- Record the source of the mismatch and whether further repair is needed. Do not replace the
  editor's newly uploaded asset.

## Verification

- Use the live URL, not the local database, to establish the result.
- Write `docs/reports/TASK-30.md` with the outcome and any remaining editorial work.
