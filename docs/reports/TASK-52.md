# TASK-52 — Admin usability for a non-technical editor

## Built
- **Copy:** seven English developer hints rewritten in Hebrew; "תווית עילית" → "שורה מעל הכותרת", "שפת הכותרת
  המוצגת" → "שפת הכותרת", the search placeholder now says "חיפוש לפי כותרת". `collectNonHebrewDescriptions` (tested) is
  wired into `hebrewLabels.test.ts`, so a new English hint fails the suite.
- **Navigation:** collections ordered by daily use; globals moved into the "תוכן" and "הגדרות" groups (Payload's default
  "גלובלים" group always sorted first). The API tab is hidden on every collection and global (`hideApiUrl`).
- **View on site:** books and the three narrative pages get a labelled button opening their public page in the language
  being edited (`adminPreview.ts`, tested).
- **Lists:** phone numbers left-to-right; dates `29 באוקטובר 2026 בשעה 23:06` in Jerusalem time (`createdAt` redeclared
  on Orders; verified by `migrate:create` that no schema change results); stock and language are plain text unless
  exceptional; paid is green; four duplicated badge components share `AdminBadge`; the one-click filters show which is
  active (`listFilterState.ts`, tested); the column picker and filter builder are hidden.
- **Forms:** root type 13px → 16px, hint and heading contrast to AA, visible input borders, textareas and the rich-text
  editor framed and sized, forms capped at 64rem, teal primary and create buttons, the language switcher filled teal,
  the lone "edit" tab hidden, schedule rows labelled with what they hold (`scheduleRowLabel.ts`, tested).

## Verified
`tsc --noEmit` clean; `eslint` 0 errors (50 existing warnings, none in changed files); `vitest` 422 passed;
`next build` ok. Every changed screen (orders list and detail, books list and edit, pages list and edit, schedule,
dashboard) was opened in a browser on the local database, as a minted local session. Fixture orders and pages used for
the check were removed afterwards. Badge colour pairs measure 6.8:1 or better; white on the teal buttons 5.8:1.

## Felt wrong
- The first review I gave said the Save button looked broken. It is Payload's disabled state (no edits yet) and the
  document header is already sticky; both were claims I made from a screenshot without checking.
- Another session started `TASK-51` while this one was planning; it renumbered itself to 53. The brief is TASK-52.
- `next build` and `vitest` were run on the final tree, not on each of the six commits.
- The orders search placeholder cannot name customer fields (Payload only reads top-level fields), so a hint line carries
  that. A real fix is stored top-level `customerName`/`customerPhone` columns and a migration.

## Still open
All of it is in `docs/BACKLOG.md` under "Admin & editable content".
