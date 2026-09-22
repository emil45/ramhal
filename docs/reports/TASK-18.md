# TASK-18 — Surface complete book courses

## What was built

- Added a trilingual `/courses` page presenting nine complete book walkthroughs: 766 lessons in
  total, with direct links to lesson one and to each full YouTube playlist.
- Paired each course with the most appropriate catalogue edition for the current locale, including
  the bilingual French editions where available; course cards without a current store edition say
  so plainly.
- Added a reciprocal course panel to every matching book page, beside the purchase and book details.
- Added the course library to desktop, mobile and footer navigation, and moved the expanded header
  navigation to the `lg` breakpoint so the additional destination does not overflow on tablets.
- Kept the public pages independent of YouTube at render time: verified IDs and counts are curated
  in one typed library until the planned full media sync exists.

## What was verified and how

- Crawled all 46 public playlists from the institute's channel and inspected the first and final
  entries of the book-length candidates; corrected for the reversed order of the Kalach playlist.
- Added unit coverage for unique playlist/lesson IDs, generated YouTube links, locale-specific
  edition selection and reverse book-to-course matching.
- `npx tsc --noEmit`, ESLint (0 errors; 18 pre-existing generated-migration warnings), all 190
  Vitest tests and `next build` pass.
- Raw-control and physical-direction grep gates pass with no matches.
- Visually checked Hebrew RTL and English LTR at desktop, 768px tablet and 390px mobile widths;
  also checked course cards and the reciprocal Daat Tevunot book-page panel.

## What felt wrong

- YouTube playlist order cannot be trusted: the Kalach playlist is reversed, so its visible first
  item is a completion video. The curated direct link therefore points to the actual lesson one.
- Some public playlists look like full courses by title but have unavailable or missing lessons;
  advertising them as complete would over-promise.

## What is still open

- `Cours de Tikoun Olam` starts at lesson 2 because lesson 1 is unavailable, and `מאמר העיקרים`
  exposes seven videos ending at lesson 8. Both remain off the complete-course page until their
  missing lessons are restored or the institute confirms how they should be presented.
- Newer `דעת תבונות בעיון` and `משכני עליון` playlists are still in progress and should be added
  only after completion.
- The later media-sync task should replace the curated counts and IDs while retaining the explicit
  editorial distinction between complete courses and ordinary playlists.
