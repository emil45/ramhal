# TASK-41 — Social links

## What was built

- Site Settings now offers Facebook and YouTube as validated platform choices, prevents duplicate
  platforms, and accepts only matching secure account URLs.
- The footer renders the configured accounts in all three locales with accessible monochrome
  brand icons and RTL-first alignment.
- The Courses page derives its playlists destination from the configured YouTube account instead
  of keeping a second account URL in code.
- Fresh databases receive the supplied accounts only while the social-links array is empty.
- `scripts/one-off/TASK-41-social-links.ts` records the guarded initialisation run used for the
  development database and refuses unrecognised database fingerprints or conflicting values.

## What was verified and how

- `npx tsc --noEmit`, ESLint, all 336 Vitest tests, and `next build` passed. ESLint reports only
  the 30 pre-existing generated-migration warnings.
- The storefront raw-control grep and `git diff --check` passed.
- The one-off script populated development (`d82df7fce6e7`) and read back both exact URLs.
- The authenticated production admin saved both exact URLs and reported `עודכן בהצלחה`.
- Browser QA against the production build caught and corrected the social row's initial RTL
  misalignment, then confirmed the final icon-and-label layout visually.
- After commit `0a24a8a` deployed, the live Hebrew, English, and French footers each exposed both
  exact account URLs and the localized heading. The live Courses page linked to
  `https://www.youtube.com/user/RamhalInstit/playlists`.
- Live diagnostics reported database fingerprint `2c951382a7f8`, matching production in
  `docs/RECOVERY.md`.

## What felt wrong

- Commit `ef5b8cd` appeared on `main` during this task, despite the repository's one-agent rule.
  It touched the earlier admin thumbnail work rather than TASK-41 files, so no changes conflicted
  or were lost.

## What is still open

- Nothing for this task.
