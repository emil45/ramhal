# TASK-36 — שו״ת with Rabbi Mordechai Chriqui

User request: add an elegant public questions-and-answers page where visitors can send a question
to the institute by email. The Rav's son passes suitable questions to him; an answer may be
published only with the asker's permission. Start with one clearly marked sample so the editorial
direction can be judged before a content model is built.

## Deliverables

- Add a localized `/questions-and-answers` page and expose it in the desktop, mobile, and footer
  navigation as `שו״ת`, `Q&A`, and `Questions–réponses`.
- Present the email workflow plainly, including prior permission for publication and the option to
  remain anonymous.
- Read the destination address from the existing site-settings contact email and open a localized,
  pre-addressed email from the primary action.
- Render one clearly identified sample question and answer in a restrained editorial layout that
  can become a large responsa archive without redesigning the reading experience.
- Include a working query-string search over the sample content to establish the archive's browsing
  pattern, with normalization for Hebrew cantillation, niqqud, and quote marks.
- Add localized page metadata and semantic question/answer markup. Do not publish structured
  `QAPage` data while the only answer is fictional sample copy.

## Constraints

- Do not add a Payload collection or migration yet. The sample is not real institute content and
  the editorial fields and approval workflow should be settled from this page before the schema is
  committed.
- Mark the sample answer visibly as design copy and state that it is not an answer from the Rav.
- Match `docs/DESIGN.md`: warm paper, teal ink, brass rules, serif headings; no gradient, dark hero,
  floating card grid, glass effect, or decorative stock imagery.
- Preserve RTL-first logical properties and use shadcn controls rather than native input or button
  elements.
- Preserve unrelated in-progress TASK-34 and TASK-35 work in the working tree.

## Verification

- Verify Hebrew, English, and French rendering at desktop and mobile widths, including the mail
  action and query-string search states.
- Run TypeScript, ESLint, Vitest, `next build`, storefront native-control grep, and physical-direction
  grep.
- Finish with `docs/reports/TASK-36.md`, commit only this task's changes, and push `origin/main`.
