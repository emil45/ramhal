# TASK-16 — Logo favicon

## What was built

- Replaced the scaffold favicon with a 256×256 transparent ICO generated from the
  institute logo.
- Preserved the logo's aspect ratio and centred it in the square canvas.

## What was verified and how

- Inspected the generated file as a 256×256, 32-bit Windows icon resource.
- TypeScript passed with `tsc --noEmit`.
- ESLint passed with zero errors and the 18 existing generated-migration warnings.
- Vitest passed all 27 files and 184 tests.
- `next build` completed successfully and generated 328 static pages.

## What felt wrong

- The detailed crest necessarily loses fine text at browser-tab size, but retaining the
  full institute mark matches the requested source and remains recognisable by silhouette
  and colour.

## Still open

- None.
