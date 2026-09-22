# TASK-19 — Refine the complete-lessons page

User request: remove promotional, AI-sounding copy from the complete book-lessons page, use
“שיעורים” rather than “קורסים”, and reconsider whether the lesson thumbnail or book cover should
lead each item.

## Deliverables

- Reduce the hero and section copy to direct, factual language in all three locales.
- Use “שיעורים” and “סדרות שיעורים” throughout the Hebrew interface.
- Make the first lesson's YouTube thumbnail the primary visual and link it directly to lesson one.
- Retain the matching store edition as a small secondary reference rather than a competing visual.
- Add the supplied פינות המרכבה and משכני עליון lesson series and connect both to their store
  editions.
- Simplify the related-series panel on book pages.
- Preserve the existing direct lesson-one and full-playlist links, RTL-first layout and shadcn
  component usage.

## Verification

- Run TypeScript, ESLint, Vitest and `next build`.
- Run the raw-control and physical-direction grep gates from `AGENTS.md`.
- Visually inspect Hebrew RTL and English LTR at desktop and mobile widths.
- Write `docs/reports/TASK-19.md`, commit directly to `main`, and push `origin/main`.
