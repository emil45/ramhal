# TASK-56 — Lessons managed in the admin

## Built
- **שיעורים** (`series`, un-hidden): course name (localized), related books (several editions), playlist link,
  first-lesson link, lesson count; rows drag into the order shown on the site (`orderable`).
- Pasted YouTube links become bare identifiers on save (`src/lib/youtubeLinks.ts`); anything else is refused with a
  Hebrew message.
- **כותרת עמוד השיעורים** (`coursesPage` global): heading, introduction, search description per language.
- `/courses` and the book page's lessons box read the database (`src/lib/courses.ts`, `src/lib/coursesData.ts`). A book
  with several courses shows each; a French visitor is linked to the French edition when the course lists one.
- Books show the courses that teach them (join field `lessonSeries`, read-only). `Books.relatedSeries` is gone.
- Removed as unused: `series.description`, `series.language`, `series.order`, `fullBookCourses.ts`.
- Migrations: `remove_unused_series_fields` (drops the old columns and the empty `books_rels` table),
  `lessons_admin` (new columns, `series_rels`, `courses_page`), `seed_courses` (the 11 curated courses and the page text).

## Verified
`tsc`, `eslint` (0 errors), `vitest` (439 passed, including a new integration test on the test database), `next build`.
Migrations applied to local `ramhal` and `ramhal_test`. Against the built app: `/courses`, `/en/courses`, `/fr/courses`
each list 11 playlists with the same book links as before (French editions on `/fr`); the Adir BaMarom book page shows
"208 שיעורים" and the playlist link; a book with no course shows no box.

## Felt wrong
`migrate:create` stops at drizzle's interactive "created or renamed?" question when a table is created and another
dropped in one step, and the wrapper has no terminal to answer it. Worked around by generating the removal and the
addition as two migrations.

## Still open
- The admin screens were not opened in a browser (login is Google-only): list, form, drag handle and the book page's
  join table need a look by hand.
- Lesson count is typed by hand and goes stale as lessons are uploaded; filling it from the YouTube Data API
  needs a key (`docs/BACKLOG.md`).
- Production: the migrations drop `books_rels`; the table only ever held the hidden, unused `relatedSeries` links.
