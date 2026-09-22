# TASK-28 — Homepage news: announcements and events as one live stream

## Why

The client asked for a front page that can carry announcements, upcoming lectures, and new
books (`PROJECT_CONTEXT` §9). `Announcements` and `Events` already exist as distinct localized,
self-expiring collections and remain so (`DECISIONS` §9). What is missing is flyer imagery,
links, and meaningful prominence for the newest live item on a phone.

These decisions are settled:

1. Images are flyers, not banners. Preserve their natural aspect ratio inside a bounded box;
   never crop them.
2. Keep two collections in the admin and present one stream to visitors.
3. Put a slim pointer to the newest live item above the masthead. With no news, render nothing.

## Scope

### Collection fields

Add the same fields to `Announcements.ts` and `Events.ts`:

- `image`: optional, non-localized upload related to `media`, labelled `תמונה`.
- `link`: optional group labelled `קישור` containing a localized optional `label` (`טקסט
  הקישור`) and optional `url` (`כתובת`). Render only when both are present.

Validate `url` with a new pure `validateNewsLinkUrl(value): true | string` in
`src/lib/newsLink.ts`. Accept site-relative paths beginning `/` and absolute `http(s)://` URLs;
reject everything else with a Hebrew message. Add tests.

Do not add book relationships, featured relationships, or pinned/featured booleans. New books
remain derived from `publishedAt`; news prominence is derived from dates.

### Pure merged stream

Add `src/lib/homeStream.ts`, exporting
`buildNewsStream(announcements, events, now): NewsItem[]`. It must not read the clock or depend on
Next/Payload runtime code. Normalize both collection shapes into:

```ts
export type NewsItem = {
  id: string
  kind: 'announcement' | 'event'
  title: string
  body: RichText's content prop type
  image: Media | null
  link: { label: string; url: string } | null
  date: string
  location: string | null
}
```

Future dates sort before past dates; future dates ascending (nearest first), past dates descending
(newest first). Tests cover the split, both sort directions, missing image/link, an incomplete
link, and empty input.

### Homepage

Replace the separate announcement and event sections with one `id="news"` section above the book
strip. It has `SectionHeading` and a list of `NewsCard`s. It disappears entirely when empty.

Add `NewsBand` above the masthead, inside `<main>`. It takes only the first stream item and shows a
compact row containing date, title, and a `#news` anchor. It renders nothing for an empty stream,
uses no image or rich text, stays one line on desktop and at most two on mobile.

Add `NewsCard` using the existing `Card`: date, title, optional event location, rich-text body,
optional flyer, and optional link. Render the flyer with `next/image`, explicit media dimensions,
`object-contain`, `w-auto`, and a container capped at `max-h-[70vh]` and narrower on desktop. Add a
one-line comment explaining why flyers must not be cropped. Render external HTTP links as outline
button anchors with `target="_blank"` and `rel="noreferrer"`; render site-relative links with
`Link`.

Final order: news band → masthead → news → books → schedule.

Move `id="schedule"` from the old announcements section to the actual schedule section so the
Beit Ramhal deep link lands on the timetable.

### Dictionary

Remove `home.announcementsTitle` and `home.eventsTitle`. Add only:

- `home.newsTitle`: `מה חדש` · `What's new` · `Actualités`
- `home.newsBandMore`: `לפרטים` · `Details` · `En savoir plus`

### Demo data

Add `scripts/seed-demo-news.mjs` and `npm run seed:demo-news`, separate from `npm run seed`.
Refuse immediately when `APP_ENV === 'production'`. Create three records in all locales: an
upcoming event with a location, an announcement with a link, and a plain-text announcement. Do not
add images; a real flyer will be uploaded through `/admin` for that path.

## Out of scope

- News anywhere except the homepage.
- Categories, tags, types, archives, or past-news pages.
- Changes to the book strip, schedule content, or masthead content.

## Verification

- `npx tsc --noEmit`, `npx eslint`, `npx vitest run`, and `npm run build` pass.
- Storefront control grep and logical-property grep return no violations.
- With demo data, `/`, `/en`, and `/fr` show the band and event-then-announcements ordering;
  `#news` scrolls correctly and the Beit Ramhal `/#schedule` link reaches the timetable.
- With no demo records, there is no empty band, heading, or stray spacing.
- Record what survives above the fold at 390px wide.
- Finish with `docs/reports/TASK-28.md`.
