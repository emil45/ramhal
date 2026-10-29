# TASK-56 — Lessons managed in the admin

The courses page and the "lessons on this book" box on each book page were curated in code
(`src/lib/fullBookCourses.ts`). The son needs one admin page, **שיעורים**, that controls both.

- A course is one `series` document: localized name, the book editions it teaches, the YouTube playlist, the first
  lesson, the lesson count. Entered once; both the courses page and the book page read it.
- Pasting a whole YouTube link is enough; the identifier is extracted on save.
- The order on the site is the order of the rows in the list (drag and drop).
- The heading and introduction of `/courses` are editable in he/en/fr.
- The book's own admin page lists the courses that teach it, read-only (a join, not a second copy of the link).
- The 11 existing courses are carried into the database by a migration, so the cut-over changes nothing visible.
