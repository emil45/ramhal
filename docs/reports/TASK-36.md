# TASK-36 — שו״ת with Rabbi Mordechai Chriqui

Brief: `docs/tasks/TASK-36-qa-page.md`.

## What was built

- Added a localized `/questions-and-answers` page in Hebrew, English, and French, linked from the
  desktop navigation, mobile navigation, and footer as `שו״ת`, `Q&A`, and `Questions–réponses`.
- Built a restrained editorial presentation: paper ground, brass rules, serif hierarchy, and one
  responsum-style reading layout rather than a grid of cards.
- Displayed the site-settings contact email directly in the hero. A small client-only control copies
  the address and reports success or failure; a separate action opens a localized, pre-addressed
  email.
- Presented the first question as normal content with a responsum number, topic, publication date,
  question, and answer. There is no process explanation, sample treatment, disclaimer, archive
  introduction, or cited-books footer.
- Added a working query-string search with a pure matcher that searches the topic, question, and
  answer. It normalizes Hebrew niqqud, cantillation, and quote marks and requires every entered term
  to match.
- Added localized search metadata and semantic headings, articles, definition data, and a
  machine-readable `<time>` value.

## What was verified and how

- Inspected the real Hebrew page at desktop and mobile widths: the email address, copy control,
  mail action, search, date, question, and answer form one continuous reading page with no gradients,
  dark hero, stock imagery, glass effects, or floating card grid.
- Inspected English and French at desktop width and confirmed correct LTR direction and localized
  copy, mail subjects, and dates. Browser geometry reported no horizontal overflow.
- Exercised the copy control in the browser and confirmed its visible success state without opening
  a mail client. Verified the mail link still resolves to the live site-settings address.
- Verified `?q=הלכה` produces the localized no-results state and a clear-search link; the default
  state renders the complete question in server HTML.
- `npx tsc --noEmit` — clean.
- ESLint — 0 errors; 30 pre-existing warnings in generated migration files.
- Vitest — 47 files, 330 tests, all passing, including the Hebrew search-normalization tests.
- `next build` — succeeds; 333 routes generated and the Q&A route remains server-rendered for
  query-string search.
- Storefront native-control grep and physical-direction grep — no violations.

## What felt wrong

- Adding both Q&A and press coverage brought the desktop header close to its useful capacity in
  French. Press coverage was later folded into the Rabbi profile, so the current navigation again
  has comfortable room.

## What is still open

- After the editorial shape is accepted, add a localized Payload collection with publication
  consent, anonymity, status, topic, stable slug, question, answer, cited works, and publication
  date; then replace the prototype matcher with the custom PostgreSQL Hebrew full-text search
  already chosen in `docs/DECISIONS.md` §14.
- Add per-question canonical URLs and structured data when the collection exists.
