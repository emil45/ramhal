<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ramhal

Website, catalogue and admin for מכון רמח״ל (Machon Ramhal), the institute that publishes and teaches
the Ramhal (Rabbi Moshe Chaim Luzzatto, 1707–1746). Next.js 16 + Payload 3 + PostgreSQL, one app, one
repo. A book page presents a *work* (text, sources, the כתר מרדכי commentary), not a SKU.

## Non-negotiables

- **One catalogue, one content model, three languages.** Hebrew at `/`, `/en`, `/fr`. Never clone
  content, a page or a field per language or currency; currency and shipping resolve at checkout.
- **RTL-first.** Logical CSS only (`ms-`, `ps-`, `start-`, `text-start`), never `ml-`/`left-`.
- **One admin persona, Hebrew-only admin UI.** The Rav never uses the system; his son runs it. Every
  label an editor sees must be Hebrew.
- **`APP_ENV`** (`development` | `demo` | `production`, required) says which deployment this is;
  **`NODE_ENV`** only says how the build is optimised. Never gate behaviour on `NODE_ENV`. `demo`
  is the deployment that uses the mock payment provider, whose screens carry their own notice. `APP_ENV` must be set for `next build`; the server refuses to start under
  a different one. The mock payment provider is refused under `production`.
- **Claims about production come from the live URL** or from `GET /api/diagnostics` (public, narrow:
  `appEnv`, `builtForAppEnv`, `latestMigration`, `backup`, `database.fingerprint`) — never from a
  database tool connection alone.
- **No service may ever charge money.** Neon free and Vercel Hobby stop at their limits; Cloudflare R2
  has no cap, so nothing may depend on R2 Infrequent Access and the audio archive stays under 10 GB
  or is decided separately.

## Code rules

The code is handed to a human developer who has never seen it; that bar is above cleverness and speed.

- Business logic is pure functions under `src/lib/`, independent of Next.js and Payload, testable
  without booting either. Framework code calls it. `src/lib/` is grouped by domain (`admin`, `auth`,
  `books`, `content`, `courses`, `locale`, `payment`, `platform`, `shop`); tests sit beside their
  subject; a new module goes in the folder whose domain it belongs to, not in `src/lib/` itself.
- One responsibility per file. No abstraction before three real cases; extract on the third copy.
- No `any`, no `as` casts to silence the compiler; derive types from the Payload schema.
- Full words, no abbreviations. Comments explain WHY, never what, and never name a task. Delete a
  comment rather than let it go stale.
- No swallowing try/catch, dead or commented-out code, unused imports, stray `console.log`, magic
  numbers or inline strings that mean something. Match the conventions already in the repo.
- Tests for anything with rules (shipping, currency, locale fallback, slugs), describing behaviour.
  Not UI.
- Commits: small, single-purpose, conventional. Work on `main`, push at the end. Never force-push or
  rewrite published history; undo with `git revert`.
- Nothing is committed that fails `npx tsc --noEmit`, `npm run lint`, `npm test` or `npm run build`.

## Running it

Local PostgreSQL 18 (`ramhal`, `ramhal_test`); Neon holds production only. Only Vercel's app, the
backup job and a deliberate production one-off connect to it: Neon's free plan meters transfer for the
whole project (5 GB a month; the database is ~40 MB) and it was exhausted once by builds and tests
running against it, which took the live site down. `vitest.setup.ts` refuses a Neon `TEST_DATABASE_URI`; Payload's config refuses a Neon
`DATABASE_URI` under `APP_ENV=development` unless a one-off sets the override below.

1. `brew install postgresql@18` (keg-only: put `/opt/homebrew/opt/postgresql@18/bin` on `PATH`),
   `createdb ramhal && createdb ramhal_test`.
2. `cp .env.example .env`, fill it in (`BACKUP_S3_*` is a read-only R2 credential).
3. `npm ci`, `npm run db:restore-local` (restores the newest production dump into both databases,
   truncates customer and order data), `npm run db:migrate`, `npm run dev`.

Local data is as fresh as the newest dump: the `database-backup` workflow (`.github/workflows/`) dumps
production every second day, or run it now with `gh workflow run backup.yml`, then re-run
`npm run db:restore-local`. Run that after any production content change an integration test depends
on. `npm run check` runs everything a commit needs.

`npm run seed` is repeatable and never overwrites an editor's values. Deploy: `vercel.json` runs
`npm run deploy:build`, which applies migrations before `next build`.

`next dev` cannot render admin pages with a Lexical `richText` field (blank screen); check them with
`next build && next start`.

**Migrations** are the only schema writer in every environment (`push: false`). Change the collection,
`npm run migrate:create -- name` (routed through a Next dev route because Payload's CLI cannot load
this config under Node: `ERR_REQUIRE_ASYNC_MODULE`), read the generated migration, `npm run db:migrate`.

## Content and storefront

- **Saving in `/admin` is publishing**; no drafts, no visibility windows. Every content page is cached
  until an editor changes something; there are no revalidation timers. Any save or delete outside
  users, carts, orders, payment events and mock sessions runs `revalidateStorefront`, which marks the
  whole storefront stale (deferred with `after()` until the transaction commits). A Payload write
  outside a Next request (seed, import, one-off, test) must pass `context:
  SKIP_STOREFRONT_REVALIDATION` or the hook throws.
- Only the visitor's own pages (cart, checkout, order, mock payment), admin and the API render per
  request.
- **Homepage visibility is manual**: an announcement or event stays until deleted. A recurring
  schedule and a dated event are different models, never one type with an optional date.
- **Language is a field** (`books.bookLanguage`), never a category. The category filter shows only once
  two real categories exist.
- **`www.ramhal.com` is the catalogue authority**; the importer refuses any book without a
  Hebrew-domain source. Legacy articles and essays are deliberately not migrated (client confirmation
  pending).
- **Images**: anything an editor might change lives in the Payload Media collection (R2 bucket
  `ramhal-media` when the six `S3_*` variables are set, `media/` locally; `S3_PUBLIC_URL` alone is
  read-only mode). `public/` holds brand furniture only (logo, emblem). Upload to Media, never commit
  an image. Video stays on YouTube.
- **Prices and totals are computed server-side**; an order snapshots the price paid. Payment status
  and fulfilment status are separate. Payments sit behind `src/lib/payment/paymentProvider.ts`
  (`mock`, `paypal`, `grow`); `confirmPayment` asks the gateway, never trusts a return URL. Each order picks its provider
  (`choosePaymentProvider.ts`): Grow, through Make (`docs/grow-make-scenarios.md`), for shekel orders to Israel from an
  Israeli mobile; PayPal for the rest. Shipping is zoned
  (Israel / Europe / rest of world), tiered by item count, free above ten books and on pickup.
- **Search**: Postgres full-text with a custom Hebrew configuration plus `pg_trgm`.
- **Legacy URLs**: only `ramhal.com` (apex and `www`) redirects; `enramhal.com` and `frramhal.com` are
  retired. `src/lib/locale/legacyRedirects.json` is generated — run `npm run redirects:generate` after a
  slug change, catalogue import or editing `scripts/legacy-redirects/pageEquivalences.mjs`, and commit
  it. Unmatched legacy URLs get an honest 404, never a blanket redirect home.
- **Auth**: Google sign-in only, gated by `ADMIN_ALLOWED_EMAILS`; no password login. Preview
  deployments cannot sign in.

### Design

Reference: a well-made printed sefer. Warm paper, one ink, brass rules, serif titles. Tokens are in
`src/app/(frontend)/globals.css`; use the existing utilities.

- Colour: `teal #00707C` is what you can *do* (buttons, links); `teal-deep #004F58` headings and
  prices; `gold #B08D42` decorates only (rules, frames), never clickable, never small text
  (`gold-ink` for that); `paper`/`paper-deep` grounds; `destructive` red for errors only. No new hues.
- Forbidden: dark heroes, decorative gradients, glass/blur, big rounded soft-shadow cards, anything
  that reads as a SaaS landing page.
- Type: David Libre (titles), Assistant (UI and text). Use `type-display|title|heading|subheading|
  prose`, never ad-hoc `text-2xl font-serif`. Headings are weight 500, never bold; no letter-spacing
  on Hebrew. On shadcn `CardTitle`/`EmptyTitle`/`FieldLegend` write the utility with a trailing `!`.
- Layout: `page-container`, `py-12` between sections, 4px scale, radius `0.25rem`. `SectionHeading`
  is the only way to head a section or page.
- Covers (`src/lib/books/cover.ts`, `CoverFrame`, `TypographicCover`): one paper tone, 2:3 ratio, the rule
  colour alone says which shelf (teal Hebrew, gold French, deep teal English, dark gold siddurim).
  Real photographs sit inside the same frame, `object-contain`.
- **No raw `<input>`, `<select>` or `<button>`** in `src/components/storefront/` or
  `src/app/(frontend)/`; use `src/components/ui/`. `grep -rn "<input\|<select\|<button"
  src/components/storefront "src/app/(frontend)"` must print nothing. Every field has a visible label.
- The catalogue loads once and filters client-side, paged at 20.

## Platform access

One env file, `.env` (gitignored; template `.env.example`). It holds the app's local config and the
credentials Claude Code uses for the platforms. Next.js loads it; the platform CLIs do not, so run them
as `scripts/ops.sh <command>`. `npm run ops:check` tests every credential.

| Platform | Variables | Use |
|---|---|---|
| Neon (project `lucky-field-60207292`, org `org-jolly-mouse-94761855`) | `NEON_API_KEY`, `NEON_PROJECT_ID` | `scripts/ops.sh neon … --project-id "$NEON_PROJECT_ID"`: production connection string, branches, restore |
| Vercel (project `ramhal`) | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | `scripts/ops.sh vercel …`: env ls, deployments, logs. Token `ramhal-claude-code`, scoped to the `ramhal` project, expires 4 Nov 2027 |
| Cloudflare account | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | R2 bucket administration only (token `ramhal-claude-r2-admin`, permission Workers R2 Storage Write; it cannot create tokens) |
| R2 `ramhal-media`, read-write | `R2_MEDIA_WRITE_ACCESS_KEY_ID`, `R2_MEDIA_WRITE_SECRET_ACCESS_KEY` | media one-offs (token `ramhal-claude-media-rw`, one bucket only) |
| GitHub | `gh` login (keyring) | secrets, workflows, CI |

A media one-off maps the write key onto the names the app reads, on its own command line:
`S3_BUCKET=ramhal-media S3_ENDPOINT=https://$CLOUDFLARE_ACCOUNT_ID.r2.cloudflarestorage.com
S3_REGION=auto S3_ACCESS_KEY_ID=$R2_MEDIA_WRITE_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY=$R2_MEDIA_WRITE_SECRET_ACCESS_KEY
scripts/ops.sh npx vite-node …`. Never name the write key `S3_*` in `.env`: local development would
then write to production media.

Rules: least privilege, one scoped token per platform, never an all-access one. Roll a token by creating
the new one first, then revoking the old. Never print, log or commit a credential, and never echo
`.env`. When a command's output might contain a secret, capture it into a file or variable instead.

## Production operations

**Locked out of `/admin`.** Google error: check OAuth client `ramhal-admin` in Google Cloud project
`machon-ramhal` (redirect URIs must include the live domain) and `GOOGLE_CLIENT_ID`/`SECRET` in Vercel.
Signs in but bounces: the `users` row is missing. Another admin can add it in Users; if the table is
empty, insert directly (`INSERT INTO users (email, role) VALUES ('x@y.z', 'admin');`) and make sure
the email is in `ADMIN_ALLOWED_EMAILS`. Vercel needs `DATABASE_URI`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `SERVER_URL` (no trailing slash) and `ADMIN_ALLOWED_EMAILS`, or the site will
not start. All are Sensitive: overwrite, never read.

**Restoring data.** Neon point-in-time restore (production branch, Branches → Restore) reaches back at
most 6 hours on the free plan. Older: the `pg_dump` files in the private R2 bucket
`ramhal-backups` (`ramhal-<UTC timestamp>.sql.gz`, every second day, kept 14 days, written by the
`database-backup` workflow; `/api/diagnostics` reports the newest one's age and the `restore-drill`
workflow proves it restores). Restore into a throwaway database, never the live one: create role `neondb_owner
NOLOGIN`, then `gunzip -c dump | psql db -v ON_ERROR_STOP=1`. `npm run db:restore-local` does this
for the local databases. Never restore into Neon without checking the result first.

**Production fingerprint.** `database.fingerprint` is a hash of the host: pooled
`ep-red-tree-b19ry3lo-pooler…` is `2c951382a7f8`, the same endpoint unpooled is `5f4bb4452fb2`.

**One-off script against production** (commit it under `scripts/one-off/<date>-<what>.ts` with the
run date in its header, never rerun it; delete old ones, `git log -- scripts/one-off` keeps the record):

1. Get the string with `scripts/ops.sh neon connection-string production --project-id "$NEON_PROJECT_ID"`
   (unpooled). Never put it in `.env` or a shell profile.
2. Dry run first, `--apply` second. Print and check the fingerprint before writing.
   ```sh
   ALLOW_PRODUCTION_ONE_OFF=TASK-<n> DATABASE_URI="<string>" APP_ENV=development \
     scripts/ops.sh npx vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2 scripts/one-off/<file>.ts
   ```
   The override value must match `TASK-<number>` (`src/lib/platform/refuseProductionDatabase.ts`). New
   scripts must set `SKIP_STOREFRONT_REVALIDATION`.

**R2 tokens** (Cloudflare → My Profile → API Tokens → Roll; S3 secret is `sha256(token value)` in
hex): `ramhal-media-rw` → Vercel `S3_*`; `ramhal-backup-rw` → GitHub `BACKUP_WRITER_S3_*`;
`ramhal-backup-ro` → Vercel, GitHub and local `BACKUP_S3_*`. CORS: `infrastructure/r2/`.
