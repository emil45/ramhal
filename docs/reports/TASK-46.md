# TASK-46 — The storefront shows what the admin contains, from the moment of the save

## Step 0
- `git push origin main` pushed 4004d4c..fdea303 (remote head was d1940a0). Vercel deployment
  `ramhal-1agusxl72` ended **Error** after 18 s (Neon over quota; `deploy:build` migrates first). Not promoted:
  `vercel inspect` shows the aliases (`ramhal-theta.vercel.app`, `ramhal-emil45s-projects.vercel.app`) still on the
  last Ready deployment `ramhal-rmqehts8e` (17 h old), and `https://ramhal-theta.vercel.app` answers 200.
- `gh workflow run restore-drill.yml` → run 35956447268 **success** (all steps).
- `backup.yml` last ran green on 23 Sep; tonight's run will fail until the Neon reset. Not touched.

## What was built
- `src/collections/hooks/revalidateStorefront.ts`: one function, used as `afterChange`/`afterDelete` on
  collections and `afterChange` on globals; calls `revalidatePath('/', 'layout')`. Skips when
  `context.disableRevalidate` is set; exports `SKIP_STOREFRONT_REVALIDATION` for writers outside Next.
- `export const revalidate = false` once, in `[locale]/layout.tsx`; the four `3600`s and the false "revalidated on
  publish / future work" comment are gone.
- Q&A is static: `?q=` search, form, dictionary keys, `questionSearch.ts` + test deleted.
- Visibility is manual: `isAnnouncementActive`, `isEventUpcoming` (+ tests) deleted; `getActiveAnnouncements` →
  `getAnnouncements`, `getUpcomingEvents` → `getEvents`; `buildNewsStream` lost its `now` argument.
- Migration `20260924_044201_remove_visibility_windows` drops `announcements.ends_at` and `events.ends_at`.
- Docs: DECISIONS §5 and §8, README "How content reaches the site", BACKLOG.

## Docs read
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md` — `revalidatePath('/', 'layout')`
  is the documented "revalidate all data"; in Route Handlers (Payload's API is one) it only marks stale and the work
  happens on the next visit.
- `.../02-guides/caching-without-cache-components.md` §"Route segment config `revalidate`" — `false` is the default and means
  cached indefinitely; the lowest value across a route's layouts and pages wins, so one line on the layout covers every page
  under it. (`cacheComponents` is not enabled in `next.config.ts`, so this is the applicable model.)
- `.../03-file-conventions/02-route-segment-config/dynamicParams.md` — `true` (default) renders params missing from
  `generateStaticParams` on first request. `[slug]` does not set it.
- Payload 3.89 types in `node_modules/payload/dist/collections/config/types.d.ts` (`AfterChangeHook`, `AfterDeleteHook`),
  `globals/config/types.d.ts` (`AfterChangeHook`) and `index.d.ts` (`RequestContext`). **`disableRevalidate` is not defined by the
  installed package** — `context` is an open `{ [key: string]: unknown }` bag; the name is the convention from Payload's website
  template. It is named once, in `revalidateStorefront.ts`.

## Attached content, with the helper that proves each
| Attached | Rendered by |
|---|---|
| Books | `booksData.ts` (catalogue, home strip, courses, book page) |
| Categories | `booksData.ts` (`depth: 1` populates `category`, filter) |
| Media | covers and gallery via Books, `pagesData.ts` hero/blocks, `getDonatePhoto` |
| Pages | `pagesData.ts` (`/ramhal`, `/rabbi-chriqui`, `/beit-ramhal`) |
| Announcements | `announcementsData.ts` (home) |
| Events | `eventsData.ts` (home) |
| Global `schedule` | `scheduleData.ts` (home) |
| Global `siteSettings` | `siteSettingsData.ts` (footer on every page, Q&A, book page, donate, courses) |

Not attached, on purpose: Users, Carts, Orders, PaymentEvents, MockPaymentSessions (personal), **ShippingSettings** (only
`shippingData.ts` → cart, checkout and `placeOrder`, all per request), **Series, Lessons, Articles** (no `src/lib/*Data.ts` and no
storefront component reads them; the book page never renders `series`). If a page starts rendering one, attach the hook
(DECISIONS §5). `revalidateStorefront.integration.test.ts` fails if the attached set changes.

**Drafts/versions:** none of the eight attached configs (or any config) has `versions`, so there is no draft state; every save is a
publish. The test asserts `versions` is falsy for each attached collection.

## Dates
- **Removed:** `announcements.endsAt`, `events.endsAt` — only drove the visibility window / were shown nowhere.
- **Kept:** `announcements.startsAt` (shown on the card and band, sorts the list; label changed to "תאריך" since it is no
  longer a schedule); `events.startsAt` (shown, sorts); `books.publishedAt` (sorts the catalogue and the new-books strip, no
  clock involved).
- **Orders:** announcements `-startsAt` (newest first); events `startsAt` ascending; home stream = announcements then events, each in
  that order. Queries use `pagination: false` — the old `limit: 50` would have hidden documents.
- **Admin dashboard:** it filtered with the same helpers, hiding past events and expired announcements from editors. Filter
  removed; now lists all events (ascending) and announcements (newest first), headings "אירועים" / "הודעות".
- No other now-based filtering exists in `src/lib/*Data.ts`, `homeStream.ts`; `selectNewBooks` sorts by `publishedAt` only.

## Migration
`npm run migrate:create -- remove_visibility_windows`; `up` = `DROP COLUMN ends_at` on both tables, `down` re-adds them. **The
generated migration and snapshot also dropped `media.prefix`** (local `.env` sets only `S3_PUBLIC_URL`, so the storage plugin's column
was missing when the schema was read; `generate:types` removed `prefix` from `payload-types.ts` too). Production has that column, so I
edited the migration to the two `ends_at` drops, rebuilt the snapshot as the previous one minus the two `ends_at` columns
(asserted equal to the generated one otherwise), and restored `prefix` in `payload-types.ts`. Applied locally with
`npm run db:migrate`. Root cause → BACKLOG.

## Route table (`next build`, local Postgres)
Before (HEAD, 231 pages, prerender-manifest: 195 routes at `initialRevalidateSeconds: 3600`, 21 `false`):
static/SSG everywhere except `ƒ` cart, checkout, checkout/return, mock-payment, order, **questions-and-answers**, admin, `/api/*`.
After (219 prerendered routes, **all `false`**):
```
○ /_not-found
● /[locale]  (he en fr)          ● /[locale]/[bookWord]  (3)        ● /[locale]/[bookWord]/[slug]  (186)
● beit-ramhal, courses, donate, press, privacy, questions-and-answers, rabbi-chriqui, ramhal  (each ×3)
ƒ /[locale]/cart  /[locale]/checkout  /[locale]/checkout/return/[token]  /[locale]/mock-payment/[providerRef]  /[locale]/order/[token]
ƒ /admin/[[...segments]]  /api/[...slug]  /api/dev-generate-types  /api/dev-migrate  /api/diagnostics  /api/graphql
  /api/graphql-playground  /api/webhooks/paypal
```
Only change: Q&A `ƒ` → `●`. Every remaining `ƒ` is visitor-personal or an endpoint. (`/api/dev-*` are dev-only routes that already exist.)

## Verification (local Postgres; `--require` preload made every `*.neon.tech` connection throw, self-tested)
- `tsc --noEmit` clean; `eslint` 0 errors (50 warnings, 4 new are the unused `payload`/`req` parameters of the generated migration's
  signature, same as every earlier migration); `npm test` 363/363 (50 files); `npm run build` exit 0; the storefront `grep` for raw
  `<input|<select|<button` prints nothing.
- Tests: `revalidateStorefront.test.ts` (unit) and `revalidateStorefront.integration.test.ts` — create/update/delete of a book, category,
  page, announcement and event, and a save of each attached global, each call `revalidatePath('/', 'layout')`; a write with
  `SKIP_STOREFRONT_REVALIDATION` does not; shipping settings and a cart do not; the attached set is exactly the table above; no `versions`.
  `next/cache.js` is the only mock. Mutation-checked (removing Events' `afterDelete` fails its test). **Media** is proven by the
  attached-set assertion only: an upload is refused in this environment's read-only media mode. Unmocked, the hook throws
  (`Invariant: static generation store missing in revalidatePath /`), so a script that forgot the opt-out fails loudly.
- End to end, `next build && next start -p 3100` against local `ramhal`, log in `scratchpad/e2e.log`. Authenticated writes: a throwaway
  admin row with a live session in the *local* database and a JWT signed with the local `PAYLOAD_SECRET`, sent to `/api/*`
  (the technique of `diagnostics/route.integration.test.ts`; no code added, nothing reachable in production; row deleted after).
  - Book title: catalogue `HIT` → PATCH → next load `MISS`, new title present, book page too; restored.
  - Global: Q&A email `ramhalcom@gmail.com` → `e2e-check@example.org` on the next load → restored.
  - Announcement created with a 2020 start date (shown — no clock) → deleted → gone from `/` on the next load.
  - New book: `/ספר/<new slug>` 200 on the first visit; after `DELETE`, 404 (`MISS`, then `HIT` of the 404).
  - Pages carry `Cache-Control: s-maxage=31536000`. 21 loads of 7 pages on the warm site: 21 × `x-nextjs-cache: HIT`, **0 database
    transactions** (`pg_stat_database`, measured with the measuring `psql` subtracted, also 60 s idle).

## What felt wrong
- Item 6 asks for `revalidate = false` on every content page; I set it once on the locale layout instead (one place, covers pages
  added later, and the prerender manifest shows all 219 routes at `false`). Say if you want it repeated per page.
- The hook runs inside Payload's write transaction, before commit. A visitor arriving in that window could re-render the old data and
  cache it. Same trade-off as Payload's own website template; not addressed.
- `seed` was already broken at HEAD (extensionless `./lib/socialLinks` import under plain Node; no Media collection in `seed.mjs`).
  Fixed both since the seed had to carry the opt-out. It ran clean; it found nothing to write on this database, so its opt-out
  writes ran only under type-checking.
- Older `scripts/one-off/*` write books/categories/media/pages/globals without the opt-out and were left untouched (they are
  records of what ran); re-running one now throws. Recorded in BACKLOG.
- `checkoutFixtures.ts` still says tests use "the long-lived Neon branch named testing" — stale since TASK-45; not touched.

## Still open (all in `docs/BACKLOG.md`)
- `migrate:create` / `generate:types` depend on `S3_*` env (media.prefix).
- One-off scripts predate the opt-out.
- Q&A archive as a collection with search.
- The PENDING checks below.

## PENDING — after the first successful deploy
- A content page returns a Vercel cache `HIT`.
- Edit a book title in `/admin`; the catalogue shows it on the next reload.
- Delete an announcement; it disappears from the home page on the next reload.
- Q&A loads (it 500ed only because of its per-request read).
- The deploy also applies `remove_visibility_windows` to production; check `/api/diagnostics` `latestMigration`.
