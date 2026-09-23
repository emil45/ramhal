# TASK-36 — שו״ת with Rabbi Mordechai Chriqui

Brief: `docs/tasks/TASK-36-qa-page.md`.

## What was built

- Added a localized `/questions-and-answers` page in Hebrew, English, and French, linked from the
  desktop navigation, mobile navigation, and footer as `שו״ת`, `Q&A`, and `Questions–réponses`.
- Built a restrained editorial presentation: paper ground, brass rules, serif hierarchy, a plain
  three-step email workflow, and one responsum-style reading layout rather than a grid of cards.
- Connected the primary action to the existing site-settings contact email with a localized subject
  line. The page explains that the Rav's son brings suitable questions to him, publication requires
  the asker's permission, and anonymity may be requested.
- Added one sample question and answer about beginning the study of the Ramhal. It is visibly marked
  as sample content and states explicitly that it is not an answer from Rabbi Mordechai Chriqui.
- Added a working query-string search with a pure matcher that searches the topic, question, answer,
  and cited works. It normalizes Hebrew niqqud, cantillation, and quote marks and requires every
  entered term to match.
- Added localized search metadata and semantic headings, articles, lists, and definition data. No
  `QAPage` structured data is emitted while the only answer is fictional sample copy.

## What was verified and how

- Inspected the real Hebrew page at 1280px: the hero, sending workflow, archive search, responsum
  number, topic margin, question, answer, and disclaimer form one continuous reading page with no
  gradients, dark hero, stock imagery, glass effects, or floating card grid.
- Inspected English and French at 1280px and Hebrew/English at a 390×844 viewport. Direction changes
  correctly, the desktop navigation fits, mobile uses the existing sheet, and `Q&A` appears in it.
  Browser geometry reported no horizontal overflow.
- Verified the email link resolves to `ramhalcom@gmail.com` from live site settings with the correct
  localized subject. It was inspected rather than opened so no mail client action was triggered.
- Verified `?q=הלכה` produces the localized no-results state and a clear-search link; the default
  state renders the complete question in server HTML.
- `npx tsc --noEmit` — clean.
- ESLint — 0 errors; 30 pre-existing warnings in generated migration files.
- Vitest — 47 files, 326 tests, all passing, including the new Hebrew search-normalization tests.
- `next build` — succeeds; 333 routes generated and the Q&A route is server-rendered for query-string
  search.
- Storefront native-control grep and physical-direction grep — no violations.

## What felt wrong

- The page necessarily makes the sample look editorially plausible, so the visible disclaimer is
  intentionally prominent. Removing it before a real approved answer exists would falsely attribute
  words to the Rav.
- Adding both the new Q&A link and the concurrently completed press link brings the desktop header
  close to its useful capacity in French. It fits at the verified width, but another top-level item
  should trigger a navigation-structure decision rather than another inline link.

## What is still open

- Replace the sample with the first real, approved question and answer.
- After the editorial shape is accepted, add a localized Payload collection with publication
  consent, anonymity, status, topic, stable slug, question, answer, cited works, and publication
  date; then replace the prototype matcher with the custom PostgreSQL Hebrew full-text search
  already chosen in `docs/DECISIONS.md` §14.
- Add per-question canonical URLs and `QAPage` structured data only when real approved answers exist.
