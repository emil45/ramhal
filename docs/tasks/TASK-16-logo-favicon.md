# TASK-16 — Use the institute logo as the favicon

User request: make the existing institute logo the site favicon and deploy it to the
production Vercel target.

## Deliverables

- Replace the scaffold favicon with a square, transparent favicon derived from
  `public/logo.png` without stretching the artwork.
- Verify the application quality gates and the generated favicon metadata.
- Deploy the committed result to the linked Vercel production project.

## Constraints

- Preserve unrelated work in the shared working tree.
- Deploy only the committed favicon task, not unrelated uncommitted changes.
- Work directly on `main`, write `docs/reports/TASK-16.md`, and push `origin/main`.

## Verification

- Inspect the favicon dimensions and format.
- Run TypeScript, ESLint, Vitest, and `next build`.
- Confirm the production favicon URL returns the new icon.
