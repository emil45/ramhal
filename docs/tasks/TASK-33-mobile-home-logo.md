# TASK-33 — Enlarge the homepage logo on mobile

User request: make the central institute logo more prominent in the mobile homepage masthead,
where the current layout leaves ample surrounding space.

## Deliverables

- Increase only the mobile size of the homepage masthead logo.
- Preserve the existing desktop size, aspect ratio, RTL layout, and surrounding content hierarchy.
- Verify the mobile result visually and run the application quality gates.

## Constraints

- Do not alter the compact logo in the site header or the logo in the footer.
- Work directly on `main`, write `docs/reports/TASK-33.md`, and push `origin/main`.

## Verification

- Inspect the homepage at a representative mobile viewport.
- Run TypeScript, ESLint, Vitest, and `next build`.
