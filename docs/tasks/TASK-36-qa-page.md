# TASK-36 — שו״ת with Rabbi Mordechai Chriqui

User request: add an elegant public questions-and-answers page where visitors can send a question
to the institute by email. Start with one question and answer so the editorial direction can be
judged before a content model is built.

## Deliverables

- Add a localized `/questions-and-answers` page and expose it in the desktop, mobile, and footer
  navigation as `שו״ת`, `Q&A`, and `Questions–réponses`.
- Display the institute email address directly, with one control that copies it and another that
  opens a localized, pre-addressed email.
- Render one question and answer as normal published content in a restrained editorial layout that
  can become a large responsa archive without redesigning the reading experience.
- Give the question a visible publication date and topic.
- Include a working query-string search over the initial content to establish the archive's browsing
  pattern, with normalization for Hebrew cantillation, niqqud, and quote marks.
- Add localized page metadata and semantic question/answer markup.

## Constraints

- Do not add a Payload collection or migration yet. The editorial fields should be settled from
  this page before the schema is committed.
- Do not add a process explanation, sample badge, disclaimer, introductory archive sentence, or
  cited-books footer.
- Match `docs/DESIGN.md`: warm paper, teal ink, brass rules, serif headings; no gradient, dark hero,
  floating card grid, glass effect, or decorative stock imagery.
- Preserve RTL-first logical properties and use shadcn controls rather than native input or button
  elements.

## Verification

- Verify Hebrew, English, and French rendering at desktop and mobile widths, including the email
  display, copy action, mail action, date, and query-string search states.
- Run TypeScript, ESLint, Vitest, `next build`, storefront native-control grep, and physical-direction
  grep.
- Finish with `docs/reports/TASK-36.md`, commit only this task's changes, and push `origin/main`.
