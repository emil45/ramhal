# TASK-14 — Build the Beit Ramhal page

User request: replace the legacy Beit Ramhal presentation with a polished, image-led page that
belongs to the existing storefront and uses the supplied photographs in `assets/beit-ramhal/`.

## Deliverables

- Add a dedicated, locale-aware `/beit-ramhal` page for Hebrew, English and French.
- Preserve the substance of the legacy Hebrew copy while editing it into clear present-day prose.
  Treat the 2015 kollel and attendance figures as dated historical figures, not current claims.
- Present both parts of the institution: the active beit midrash and the Padua-inspired synagogue,
  including the building's stated size, four-floor structure and principal spaces.
- Use web-ready derivatives of the supplied source photographs, with meaningful alternative text,
  responsive `next/image` rendering and no avoidable layout shift.
- Add Beit Ramhal to the desktop header, mobile navigation and footer in every locale.
- Stay inside the established printed-sefer visual system: warm paper, teal actions, gold rules,
  serif headings, restrained shadcn components, RTL-first logical layout and no raw controls.

## Verification

- Run TypeScript, ESLint, Vitest and `next build`.
- Check the raw-control and physical-direction grep gates from `AGENTS.md`.
- Visually inspect Hebrew RTL and English LTR at desktop and mobile widths.
- Write `docs/reports/TASK-14.md`, commit directly to `main`, and push `origin/main`.
