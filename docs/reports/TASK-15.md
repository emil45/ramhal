# TASK-15 — Expand the Ramhal teaching page

## What was built

- Replaced the three-paragraph `/ramhal` page with a substantial editorial page in Hebrew,
  English and French.
- Hebrew now joins the short biography to the legacy “רמח״ל ותורתו” essay, organised around
  אמונה, הנהגה and גילוי יחודו, with source-labelled quotations and a concise conclusion.
- English now presents the institute's full biographical material as six readable chapters: early
  study, the Maggid and study circle, the controversy, Amsterdam, the Land of Israel and legacy.
- French now combines the legacy biography and philosophical essay, correcting its grammar and
  clarifying Hanhaga, the rational reading of Kabbalah and Guilouy Yihoudo without reproducing the
  old page's repetitions or unsupported rhetoric as neutral fact.
- Added a shared editorial layout with an introductory pull quote, in-page contents navigation,
  restrained reading width, book-like type and locale-aware RTL/LTR flow.
- Added locale-specific page titles and search descriptions.

## What was verified and how

- `npx tsc --noEmit` and ESLint for the route: clean.
- `npm test`: 27 files and 184 tests passed.
- `npm run build`: production build passed; all three `/ramhal` locale pages were statically generated.
- Raw-control and physical-direction grep gates: clean for the page and unchanged storefront scope.
- Browser inspection at desktop width for Hebrew, English and French, and at 390px for Hebrew.
  The mobile document measured 375px content width against a 390px viewport with no horizontal
  overflow; headings and quotations remained contained.
- Cross-checked the central chronology (Padua 1707, Amsterdam period, 1740 first edition of
  `Mesillat Yesharim`, move to Acre in 1743 and death in 1746) against independent reference
  sources. Claims retained only from the institute's account are identified as such or framed as
  later tradition.

## What felt wrong

- The legacy English copy states several youthful milestones with great precision but without
  citations. The page attributes those details to the institute's biography instead of presenting
  every one as independently established fact.
- Traditions disagree on the Ramhal's burial place. The page states Acre as his place of residence
  and death and mentions the Tiberias connection only as tradition; it does not choose between
  competing burial traditions.

## What is still open

- These institutional pages remain code-backed. If more long-form pages are added, the existing
  Payload `Pages` collection should become the editing surface rather than adding another hardcoded
  article.
- No historical portrait was introduced because none was supplied and an unverified decorative
  likeness would weaken the page rather than improve it.
