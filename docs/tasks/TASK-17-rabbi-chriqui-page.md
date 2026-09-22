# TASK-17 — Enrich the Rabbi Chriqui page

User request: give the Rav Chriqui page a more elegant, substantial visual treatment; enlarge the
portrait beside the introductory text; add the supplied `IMG_5791.jpeg`; integrate the supplied
YouTube interview thoughtfully; and organise loose image files into relevant asset directories.

## Deliverables

- Rework the trilingual biography into a spacious editorial page within the existing printed-sefer
  visual system.
- Give the Rav's portrait a prominent, responsive hero treatment.
- Add the Kan Moreshet interview `heJLjGQZhsY` as an accessible, responsive, lazy-loaded embed.
- Add the supplied Hanukkah photograph with locale-specific alternative text and caption.
- Optimise photographs with FFmpeg, including correct EXIF rotation, and place all loose supplied
  assets in purpose-named directories under `public/`.
- Add locale-specific metadata for the page.

## Verification

- Run TypeScript, ESLint, Vitest and `next build`.
- Run the raw-control and physical-direction grep gates from `AGENTS.md`.
- Visually inspect the Hebrew page at desktop and mobile widths and check English/French direction.
- Write `docs/reports/TASK-17.md`, commit directly to `main`, and push `origin/main`.
