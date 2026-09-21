# TASK-15 — Expand the Ramhal teaching page

User request: enrich the Hebrew `/ramhal` page with the substantial “רמח״ל ותורתו”
material from the legacy site, while making a long theological text inviting and easy to read.

## Deliverables

- Preserve the existing concise biography and integrate the legacy teaching text as a structured
  Hebrew article rather than an undifferentiated transcription.
- Establish a clear reading path: introduction, the Ramhal's definition of Kabbalah, three key
  ideas, detailed sections on faith, divine governance and the revelation of unity, and a conclusion.
- Distinguish primary quotations from editorial prose and retain their source references.
- Add a compact in-page contents rail for desktop and a readable equivalent on narrow screens.
- Expand the English page from the institute's legacy biography and the French page from its legacy
  biography and essay. Edit both for clarity, chronology and idiomatic language rather than
  preserving awkward machine-like phrasing.
- Stay inside the printed-sefer storefront system: warm paper, teal hierarchy, gold rules, serif
  display type, RTL-first logical properties, restrained surfaces and no raw controls.

## Verification

- Run TypeScript, ESLint, Vitest and `next build`.
- Run the raw-control and physical-direction grep gates from `AGENTS.md`.
- Visually inspect the Hebrew page at desktop and mobile widths.
- Write `docs/reports/TASK-15.md`, commit directly to `main`, and push `origin/main`.
