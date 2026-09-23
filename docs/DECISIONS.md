# Ramhal — Decisions in force

Only decisions that hold today. No task history, no superseded options, no reversal narrative —
`git log` has that. Open questions and unfinished work live in `docs/BACKLOG.md`, not here.

---

## 1. What the site is

Not a shop with a blog attached. It represents **מכון רמח״ל**, the institute Rabbi Mordechai
Chriqui built around publishing the Ramhal (Rabbi Moshe Chaim Luzzatto, 1707–1746). A book page
presents a *work* — text, sources, the **כתר מרדכי** commentary, why the edition exists — not a
SKU. Depth is the point, not clutter.

## 2. Structure

**One catalogue, one content model, three languages, not three sites.** Hebrew is the default at
`/`; `/en` and `/fr` are prefixed. Currency and shipping resolve at checkout by destination, never
by cloning the site — the legacy per-currency clones are the disease being cured, and reintroducing
that shape anywhere (site, category, field) is always a mistake. **RTL-first**: logical CSS
properties only (`ms-`, `ps-`, `start-`), never `ml-`/`left-`; the LTR locales fall out of it.

## 3. Who operates it

The Rav does not use the system at all; his son does all administration. One admin persona, but
roles exist so a second editor is addable — in principle: see §10, which makes that addition cost an
environment change, not just a form.

## 4. Stack

**Next.js 16 + Payload 3 + PostgreSQL, one application, one repo.** Chosen for field-level
multilingual content, a built-in Hebrew admin, and no recurring licence that can lapse — the data
stays in plain Postgres tables even if Payload disappears. The ecommerce plugin ships collections
(products, variants, carts, orders, transactions, addresses) and Stripe only; it ships **no shipping
engine and no tax logic at all** — both are ours to build and keep small.

**Search: Postgres full-text with a custom Hebrew configuration** (niqqud stripping, prefix-letter
handling) plus `pg_trgm`, not a separate search service — Postgres ships no Hebrew text search
configuration by default, and at this catalogue's size building one is enough.

**Rejected and not being revisited:** Shopify and WooCommerce (freedom/multilingual failures — see
§9); Astro (Payload doesn't embed in it); Medusa (a second service for a project with no maintenance
budget); Supabase in place of Neon (Drizzle's prepared statements don't survive Supavisor's
transaction-mode pooler).

## 5. Hosting & environments

**Content is static, the shop is dynamic.** Catalogue and article pages are generated ahead of time
and revalidated periodically; cart, checkout, orders and admin render per request. **Vercel**,
Frankfurt region. **Neon Postgres** holds production and nothing else. **Only two things ever
connect to Neon: Vercel's deployed app (its build and its runtime) and the nightly `pg_dump`.**
Local development, `next build` and the test suite run against a local PostgreSQL 18 restored from
the latest backup and sanitised of customer data (`npm run db:restore-local`; databases `ramhal` and
`ramhal_test`). Why: Neon's free plan meters 5 GB of network transfer per month for the whole
project — every branch, and Object Storage too — and the required `next build` and `npm test` before
every commit, a `testing` branch, restore drills and covers served from the Neon bucket exhausted it
on 23 September 2026, blocking the live site along with the local work. Nothing in the repository
needs Neon to work: `vitest.setup.ts` refuses a `TEST_DATABASE_URI` on `*.neon.tech` always, and the
Payload config refuses a `DATABASE_URI` there when `APP_ENV=development` unless a one-off script sets
`ALLOW_PRODUCTION_ONE_OFF=TASK-NN` for its own command (`docs/RECOVERY.md`). A script that mutates
data still follows that one-off procedure. `APP_ENV` (`development` | `demo` | `production`, required, no default) says which deployment this
is; `NODE_ENV` only says how the build is optimised — never gate behaviour on `NODE_ENV`. The mock
payment provider is allowed under `development`/`demo` and refused under `production`. `demo` also
renders a permanent, undismissable banner, baked in at build time — `APP_ENV` must be set for
`next build`, and the server refuses to start if it differs from what it was built for.

## 6. Media

**Video stays on YouTube**, never rehosted; a sync job would index channel metadata rather than
mirror files. **MP3s are meant to be self-hosted** on S3-compatible object storage once that phase
starts. Neither the sync job nor the audio archive is built yet — this is the intended shape, not a
completed feature. **Uploaded media (covers, page images) lives in Cloudflare R2**, bucket
`ramhal-media`, served from its `r2.dev` address and uploaded directly from the admin browser. R2 is
used because it has no egress fee and its free tier (10 GB, Standard storage class only —
Infrequent Access has no free tier) is separate from Neon's transfer allowance. `r2.dev` is
rate-limited and documented as non-production: a custom domain on the bucket is a go-live blocker
(`docs/BACKLOG.md`). Local environments set only `S3_PUBLIC_URL`, which shows the bucket's files and
refuses uploads, so a laptop can never write to production media.

## 7. Store & payments

Prices and totals are always computed server-side, never trusted from the client. An order snapshots
the price actually paid — never a reference to the book's current price. Payment status and
fulfilment status are separate facts. Payments sit behind one interface
(`src/lib/payment/paymentProvider.ts`): start a payment, confirm it, mark the order paid. PayPal is
the first real implementation, using its hosted checkout page — card details never touch this site.
`confirmPayment` asks the gateway what happened rather than inferring it from which redirect URL was
hit, since a return URL is buyer-typeable; expect the same discipline from any future adapter.
Shipping is zoned (Israel / Europe / rest of world), tiered by item count, free above ten books and
free on self-pickup.

## 8. Homepage content

Anything dated expires itself — an announcement or event past its own end date stops showing
without anyone having to remember to clear it. A recurring schedule (daily/weekly shiur and prayer
times, `ShippingSettings`'s sibling global `schedule`) and a one-off dated event (a hilula, a
seminar) are modelled as different things, never one type with an optional date — they look alike on
a page and are nothing alike to edit.

## 9. The freedom principle

Set by the client: not to be locked into a vendor the way the legacy site is locked into its
builder, with two decades of content and no export. Data lock-in (content, catalogue, URLs) is the
real trap; a payment gateway holding almost none of your data is not — switching it is an adapter,
not a migration. The second freedom is from us: small, boring, well-documented code over clever code
only its author understands.

## 10. Admin authentication

**Google sign-in only** (`payload-oauth2`), gated by `ADMIN_ALLOWED_EMAILS` in a `beforeLogin` hook —
the only gate, so it covers password login, the Google callback and the REST login route alike.
`onUserNotFoundBehavior: 'error'` refuses to invent a user for any Google account that merely
completes the flow. There is **no local password login** (`disableLocalStrategy`). Consequence: if
`ADMIN_ALLOWED_EMAILS` is ever emptied, or the `users` table is ever fully emptied, nobody — including
whoever manages the deployment — can sign in through the app; recovery is a direct database insert
(`docs/RECOVERY.md`). That is the correct failure direction (closed, not open), chosen deliberately.
Google sign-in does not work on Vercel preview deployments (the redirect URI is registered against
the exact production origin); previews cannot authenticate at all right now.

## 11. Backups & production verification

Two independent recovery mechanisms: Neon's own point-in-time restore (a few hours of history on the
free plan) and a nightly `pg_dump` to the private R2 bucket `ramhal-backups`, kept two weeks
(`.github/workflows/backup.yml`). Only the backup workflow's credential can write there; the
restore drill, the local restore and the app's own status check read with a separate read-only one.
The restore drill restores into a throwaway Postgres container, never a Neon branch.
Procedure for both: `docs/RECOVERY.md`. **A claim about production is established through the live
URL or through what the running app reports about itself — never through a database tool connection
alone.** `GET /api/diagnostics` is public but narrow: an anonymous request gets `appEnv`,
`builtForAppEnv`, `latestMigration`, `backup`, and `database.fingerprint` (a short hash of the
connection host, comparable against the value recorded in `docs/RECOVERY.md`). The full
`database.host`/`database.name`/`database.user` only appear for an authenticated admin session.

## 12. `www.ramhal.com` is the catalogue authority

The five book-category pages on `www.ramhal.com` (three Hebrew, one French, one English) are the
complete catalogue source of truth. `frramhal.com` and `enramhal.com` may supply a translation,
another currency's price, or a redirect URL for a book that already matches one of those five pages —
they may never introduce a book absent from them. The importer refuses any reconciliation candidate
without a Hebrew-domain source entry, so a from-scratch import reproduces this rather than
reintroducing the three-site drift.

## 13. Language is a field, not a category

`books.bookLanguage` is the only place a book's language lives. A category names what *kind of work*
a book is (today, only `siddurim-machzorim` is real) and must never encode language — three category
rows that duplicated language were removed for exactly that reason. The storefront's category filter
only renders once at least two real categories are populated; it needs no code change to reappear
when a second one (קבלה, מוסר, …) is added.

## 14. Legacy articles and essays are not migrated

The French parsha essays and other legacy long-form articles were deliberately left out of the
rebuild. This reverses the client's original request to migrate the full archive and needs their
explicit confirmation — tracked in `docs/BACKLOG.md`, not yet resolved.

## 15. A known workaround: Payload's CLI against Next 16

`payload migrate` / `migrate:create` do not work in this project on any currently-available Node
version — two independent root causes in how Payload's CLI loads a TypeScript config under `require()`
against packages that use top-level `await import`. Schema tooling is routed through Next's own
bundler instead: `scripts/dev-migrate.mjs` + `src/app/(payload)/api/dev-migrate/route.ts` for
creating migrations, `scripts/migrate.mjs` for applying them. Revisit only by directly testing
`payload migrate:create` again after a Payload/Next/Node upgrade; if it no longer throws
`ERR_REQUIRE_ASYNC_MODULE`, the workaround's own code comments name what to check next.

## 16. One home for images

Every image an editor might ever change lives in the Payload Media collection (object storage in
deployed environments) — one source of truth: the database + bucket. `public/` holds only brand
furniture that changes with a redesign: logo, favicon, the 40th anniversary emblem — nothing
editorial. The repo holds no source/original image folders; git history keeps them.

## 17. No service may ever charge money

The owner's rule. Neon's free plan and Vercel Hobby stop at their limits instead of billing: Neon
suspends compute once the monthly transfer allowance is used (`docs/BACKLOG.md` cites its docs), and
Vercel Hobby has monthly allotments with no on-demand billing and pauses the account when they are
exceeded (Vercel docs, "Limits" and "Why has my account or deployment been paused?"). Cloudflare R2
has **no spending cap** — its budget alerts are email-only — so that one is handled outside the code:
the owner keeps a $1 budget alert on the Cloudflare account and a low-limit payment card on file.
No usage monitoring is built. R2 is safe by construction only while nothing depends on Infrequent
Access, and while the audio archive stays inside 10 GB or is decided separately (`docs/BACKLOG.md`).
