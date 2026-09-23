# TASK-43 — Branded production error UI

## What was built

- Added a root `global-error` boundary that does not depend on Payload or either root layout.
- Added Hebrew, English, and French recovery copy selected from the current URL, with retry and
  locale-correct home actions.
- Matched the storefront's paper, teal, gold-rule, logo, and type treatment in a self-contained
  responsive stylesheet.

## What was verified and how

- Triggered the real Payload root-layout failure locally and confirmed the custom fallback at
  desktop and 390px in Hebrew.
- Ran the compiled production server and confirmed Hebrew, English, and French copy, title,
  direction, and home destination without the Next.js development overlay.
- `npx tsc --noEmit`, ESLint, all 316 database-independent Vitest tests, `git diff --check`, the
  storefront raw-control grep, and `next build --experimental-build-mode compile` passed.
- The full Vitest run reached 318 passing tests before database-backed suites failed solely because
  Neon rejected every connection with its project quota exhausted.
- The full Next build compiled and passed TypeScript, then failed while collecting book-page data
  for the same Neon quota error.

## What felt wrong

- Full verification and deployment depend on a live external database even for this self-contained
  error UI.

## What is still open

- Re-run all integration tests and the full build, then deploy and verify the live fallback after
  Neon access returns. The quota blocker is already recorded in `docs/BACKLOG.md`.
