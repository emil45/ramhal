# TASK-39 — Rabbi page section order

## What was built

- Moved the filmed interview above the press coverage on the Rabbi Chriqui page.
- Made press coverage the final page section in Hebrew, English, and French.
- Left both sections' markup and styling unchanged.

## What was verified and how

- Confirmed the source order is biography → filmed interview → press coverage.
- `npx tsc --noEmit`, `npx eslint`, `npx vitest run`, and `npm run build` passed.
- Vitest passed all 330 tests. ESLint retained 30 pre-existing generated-migration warnings and
  reported no errors.

## What felt wrong

- Nothing. This is a source-order-only change.

## What is still open

- Nothing for this task.
