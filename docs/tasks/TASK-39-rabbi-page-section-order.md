# TASK-39 — Rabbi page section order

## Why

The filmed conversation is part of the Rabbi Chriqui profile itself and should appear before the
supporting press coverage. The press archive should close the page.

## Scope

- Move the filmed interview above the press coverage on the Rabbi Chriqui page.
- Keep both sections' markup and styling unchanged.
- Make the press coverage the final section in every locale.

## Verification

- `npx tsc --noEmit`, `npx eslint`, `npx vitest run`, and `npm run build` pass.
- Confirm the source order is biography → filmed interview → press coverage.
- Finish with `docs/reports/TASK-39.md`.
