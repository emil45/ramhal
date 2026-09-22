# TASK-16 — Use the institute logo as the favicon

## What was built

- `src/app/favicon.ico` regenerated from `public/logo.png` (sharp): the logo's
  content composited onto a transparent 256×256 square canvas, centred, with no
  stretching of the artwork.

## What was verified and how

- **Aspect ratio preserved**: measured the non-transparent pixel bounding box of
  both files. Logo content ratio 0.902, favicon content ratio 0.905 — same shape,
  confirming the composite scaled uniformly rather than stretching to fill the
  square.
- **Format/size**: `favicon.ico` is a 256×256, 32-bit RGBA icon (transparent
  background, single frame).
- **Quality gates**, all run against the working tree with only this task's
  change staged:
  - `tsc --noEmit` — clean.
  - `eslint .` — 0 errors (18 pre-existing warnings in migration files,
    unrelated to this change).
  - `vitest run` — 27 files, 184 tests, all passing.
  - `next build` — succeeds, all 328 static paths generated.
- **Deployed**: pushed to `origin/main`; Vercel's GitHub integration built and
  promoted it to production automatically. Confirmed
  `https://ramhal-theta.vercel.app/favicon.ico` returns HTTP 200 with the same
  270,622-byte 256×256 icon as the committed file.

## What felt wrong

- The working tree carried unrelated in-progress changes (a Beit Ramhal photo
  swap to a carousel, a new `embla-carousel-react` dependency) when this task
  picked up. Per the brief's constraint, only the favicon file and this task's
  own docs were staged and committed; the carousel work was left uncommitted
  and untouched in the tree, so it will surface again as pending changes for
  whoever picks it up next.

## What is still open

- The Beit Ramhal carousel changes remain uncommitted — that's separate work,
  not part of this task, and needs its own commit/task accounting.
