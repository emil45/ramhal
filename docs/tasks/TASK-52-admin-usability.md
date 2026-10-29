# TASK-52 — Admin usability for a non-technical editor

The admin is Payload's default skin with Hebrew labels. One person runs it, he is not technical, and
he reaches it only through Google sign-in (`docs/DECISIONS.md` §3, §10). A designer's review of the
live pages found the following; this task fixes what can be fixed in configuration, CSS and small
components, without forking Payload.

## Scope

1. **Copy.** No English or developer text in the editor's view: the Schedule field hints, the
   "תווית עילית" label, the "גלובלים" group name, the "שפת הכותרת המוצגת" column. A test fails when a
   field description is mostly Latin letters.
2. **Navigation.** Daily work first (חנות, תוכן), settings and system last. Globals move into a
   named group instead of Payload's default one, which always sorts first.
3. **Fewer controls.** The API tab and URL are hidden everywhere. The column picker and filter builder
   in list headers are hidden; the one-click filters above each list stay and show which one is active.
4. **Lists.** Normal state is quiet, the exception is loud: stock badge only for out-of-stock, language
   badge only for a non-Hebrew title. Payment status uses green for paid (Payload's own "success"
   colour is blue). Phone numbers render left-to-right inside the right-to-left table; dates read
   `29 באוקטובר 2026, 22:22`.
5. **Forms.** Larger type and hints, visible input borders, textareas that grow with their text, a
   "view on site" button on every document that has a public page, and schedule rows that say what
   they contain when collapsed.
6. **Chrome.** The content-language switcher is prominent; the create button is the primary colour.

## Out of scope (backlog)

Resizing uploaded photos in the browser; a live preview pane; a custom nav; saved default list
filters (Payload has no per-user default outside preferences).

## Verification

`tsc --noEmit`, `eslint`, `vitest`, `next build`; then every changed screen looked at in a browser
against the local database (`ramhal`), never Neon.
