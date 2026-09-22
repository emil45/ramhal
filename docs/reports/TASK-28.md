# TASK-28 — Homepage news stream

Brief: `docs/tasks/TASK-28-homepage-news.md`.

## What was built

- Added optional shared flyer and link fields to announcements and events, including a pure
  Hebrew-error URL validator for site-relative and absolute HTTP(S) links.
- Added and applied the `news_images_and_links` migration; regenerated Payload types.
- Added the pure `buildNewsStream` normalizer and date ordering: upcoming items nearest-first,
  followed by already-started items newest-first.
- Replaced the homepage's separate announcement/event sections with one localized news stream,
  plus a compact newest-item band above the masthead and reusable `NewsCard` rendering.
- Flyer images preserve their natural aspect ratio with `object-contain`; links use localized
  labels and distinguish internal navigation from external tabs.
- Moved `id="schedule"` onto the real timetable and added the two new dictionary keys in Hebrew,
  English, and French while removing the obsolete keys.
- Added the separate, repeatable `npm run seed:demo-news` command. It seeds one event and two
  announcements in all three locales and refuses before Payload initializes in production.

## What was verified and how

- `npx tsc --noEmit`: passed.
- `npx eslint`: passed with zero errors; only the pre-existing generated-migration unused-argument
  warnings remain. This migration adds none.
- `npx vitest run`: all 44 files and 306 tests passed, including 18 new URL/stream assertions.
- `npm run build`: passed; 327 static pages generated and all three homepages prerendered.
- Required storefront-control and physical-direction greps returned no matches. No obsolete
  announcement/event dictionary key remains.
- `APP_ENV=production npm run seed:demo-news` refused immediately, before connecting to Payload.
- Browser verification against the running application confirmed `/`, `/en`, and `/fr` each show
  the localized band and the same event → newer announcement → older announcement order. The band
  link set `#news` and placed the section at the scroll margin. The Beit Ramhal timetable link set
  `#schedule` and landed on the actual schedule heading.
- Removed only the three demo records, reloaded the running homepage, and confirmed `#news`, its
  band link, heading, and spacing were absent while the masthead became the first main section.
  Re-ran the seed afterward to restore all three records.
- At a 390×844 viewport, the 38px news band sits below the 65px mobile header. The entire 549px
  masthead remains above the fold (ending at about y=653), leaving about 191px for the start of the
  news section; the full logo, title, tagline, and both actions are visible without scrolling.

## What felt wrong

- A Next development process that was already running when the migration landed retained its
  failed prerender until restart. The database schema itself was correct; restarting the process
  cleared the stale error page.
- The demo record with a link uses one non-localized URL, as required by the content model. Editors
  must therefore choose a destination that is appropriate from every locale or supply a fully
  qualified external URL.

## What is still open

- Emanuel still needs to upload a real portrait flyer through `/admin` to judge the real asset's
  legibility and alternative text. The no-crop rendering path is implemented and build-verified,
  but the brief deliberately forbids a synthetic seeded image.
- No claim about a deployed production page was made or verified in this task.
