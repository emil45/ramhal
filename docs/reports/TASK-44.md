# TASK-44 — Stop the catalogue fetch from pulling the whole database per book page

## What was built

- `getCatalogueBookBySlug` (`src/lib/booksData.ts`) queries one book (`where urlSlug`, `limit: 2`,
  depth 1) and keeps the more-than-one-match integrity throw. Its all-locales title lookup is
  scoped by the same `where`, run in parallel with the book query rather than after it (same rows
  as scoping by id, one fewer round trip).
- `getBookUrlSlugs`: one query, `depth: 0`, `select: { urlSlug: true }`, `pagination: false`.
  `urlSlug` is not localized (single `url_slug` column, `src/migrations/20260918_122803_books_url_slug.ts`),
  so one query covers all three locales; `generateStaticParams` no longer calls `getCatalogueBooks`.
- `getCatalogueBooks` selects only card fields (below) and uses `pagination: false` instead of
  `limit: 500`. Title lookup shared by list and single-book paths (`titlesByLocale`), and the
  category/`displayTitle` mapping shared through `displayFields`.
- Two types: `CatalogueBook` (card fields) and `CatalogueBookDetail` (whole book, for its own page).
- `getCatalogueBooks`, `getCatalogueBookBySlug` and `getBookUrlSlugs` wrapped in React `cache()`.

### Field list for `getCatalogueBooks` (step 3)

`id`, `urlSlug`, `bookLanguage`, `prices`, `publishedAt`, `cover` (populated at depth 1, whole
Media document), `category` (populated, whole Category), plus `displayTitle` from the separate
titles-only query. Read by: `ProductCard` (urlSlug, bookLanguage, category, cover, displayTitle,
prices), `CoverImage`/`PriceTag`/`isPurchasable`, `sortCatalogue`/`selectNewBooks`/
`selectFeaturedBooks` (prices, publishedAt, cover), `CatalogueClient` filter and sort
(bookLanguage, category, prices, displayTitle), courses page (urlSlug, bookLanguage, category,
cover, displayTitle). Dropped: description, gallery, subtitle, credits, isbn, review fields,
shipping units, related series, import fields.

### Sweep for fetch-everything-then-filter (step 5), not changed

- `announcementsData.ts`, `eventsData.ts`, `dashboardData.ts`: fetch up to 50 rows, filter by date
  in JS. Small tables, not book-scale; could move the date test into `where`.
- `serverCart.ts` `findCartBySessionId`: depth 1 resolves every cart line to a full Book
  document, description included. Per visitor with a cart, small N.
- `cartActions.ts` `addToCart`: `findByID` on a whole book at default depth just to read prices.
- `placeOrder.ts`: correctly `id in [...]`, but reads whole books at depth 0; could `select`.
- Media and Category populated whole at depth 1 in the card query; Payload's `populate` option
  could trim them. Not done: `url` on media and its sizes is filled by the storage plugin's read
  hooks and I could not check without a database that a trimmed populate still produces them.

## Open question 1: local Postgres for local checks

Assessment, not built. Recommendation: yes.

- The multiplier is real: `next build` (mandatory before each commit) prerenders every book page
  against whatever `DATABASE_URI` points to, and the integration tests use the `testing` Neon
  branch, which shares the same project-wide allowance. Both can move to a local database.
- Cheapest path is Homebrew `postgresql@18` (matches `PG_VERSION` in `backup.yml`), not Docker;
  neither Docker nor any Postgres client is installed on this machine now. A `docker compose`
  file is an equally small alternative for developers who prefer it.
- Needed: one script (`scripts/restore-local-database.*`) that downloads the newest
  `ramhal-*.sql.gz` from the backup bucket (read credential already exists, see `docs/RECOVERY.md`),
  drops and recreates a local database, and pipes it through `psql`. A ~40 MB database dumps to a
  few MB, so one refresh costs almost no transfer. Then local `.env` sets `DATABASE_URI` and
  `TEST_DATABASE_URI` to localhost.
- What breaks or needs care: (a) the dump is plain SQL made against Neon, so it may reference the
  `neondb_owner` role and Neon-only extensions; expect to restore with `--no-owner`-style handling
  and to try it once — unverified. (b) Data is up to a day old, so a just-edited admin change is
  absent locally; an on-demand dump avoids that. (c) Media URLs point at the bucket; with the S3
  variables unset, local pages show typeset covers or broken images, which is fine for builds.
  (d) `refuseProductionDatabase` and the retired development-branch guard argument reverse:
  local work again has a database it can freely write to, so the "local dev writes to production"
  risk from TASK-42's decision disappears.
- The `deploy:build` on Vercel keeps hitting Neon, once per deploy, which is the intended use.

## Open question 2: does Neon Object Storage egress count?

Yes. Neon's docs state the allowance "is per project and shared across all products in that
project, including Postgres, Object Storage, and Functions", and for Object Storage that "data
transferred out counts toward your public network transfer allowance, which is shared across all
products". Free plan: 5 GB per project per month; past it, compute is suspended until the next
billing period or an upgrade.
Sources: https://neon.com/docs/introduction/plans and
https://neon.com/docs/introduction/network-transfer.
Consequence: covers served from the Neon bucket spend the same 5 GB as queries. Cloudflare R2
(already the intended archive host in `.env.example`) has no egress fee.

## What was verified and how

- `npx tsc --noEmit` clean; `npm run lint` 0 errors (46 pre-existing warnings); 316 database-free
  Vitest tests pass.
- Nothing ran against a database.

## What felt wrong

- `payload.find` with `select` returns a narrowed type that is assignable to `Pick<Book, ...>`
  without casts, but the `locale: 'all'` title query still needs its two existing casts.

## What is still open

- Deferred until Neon accepts connections (also in `docs/BACKLOG.md`): JSON byte size of
  `getCatalogueBooks(locale)` and of the single-book result before and after; Payload query count
  per `next build` before and after; a real `next build` and the `booksData` integration test.
- Confirm the card query still populates `cover` and `category` when `select` names them.
- The two open questions above need decisions.
