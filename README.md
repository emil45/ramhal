# Ramhal

The multilingual website, catalogue and administration application for מכון רמח״ל (Machon Ramhal).
Hebrew is served at `/`; English and French are served at `/en` and `/fr`. Read
`docs/DECISIONS.md` before changing the content model or deployment architecture, and
`docs/DESIGN.md` before touching a storefront component. `docs/BACKLOG.md` has open work.

## Stack

Next.js 16.3.4 + Payload 3.89 + PostgreSQL, one application, one repo. TypeScript, Tailwind 4 +
shadcn/ui, React 19. Node 22.x (`.nvmrc` pins the exact development version).

## Environments

Hosted on **Vercel** (Frankfurt function region). **Neon Postgres** has three long-lived branches:

| Branch | Points at | Used by |
|---|---|---|
| `production` | The live site (`APP_ENV=demo` today — see `docs/BACKLOG.md`) and Vercel's Production environment | The public |
| `development` | A copy-on-write fork of `production`, refreshed manually ("Reset from parent" in the Neon console) | Local `.env` |
| `testing` | A separate long-lived fork of `production` | `TEST_DATABASE_URI`, the test suite only |

Production's database fingerprint is recorded in `docs/RECOVERY.md` — compare `GET
/api/diagnostics`'s `database.fingerprint` against it to confirm you're looking at the same
database, rather than trusting a remembered host string (`docs/DECISIONS.md` §10–§11).

## Storage

Book covers and other media go to an S3-compatible bucket (Neon Object Storage today; Cloudflare
R2 is intended once a larger audio archive exists) when the six `S3_*` variables are set, or to
the local `media/` folder in development when they are unset. Uploads go directly from the
authenticated admin browser to the bucket; Payload only ever writes the database record.

## Backups and restore

Two independent mechanisms: Neon's own point-in-time restore (a few hours of history on the free
plan) and a nightly `pg_dump` to object storage, kept two weeks
(`.github/workflows/backup.yml`). Full restore procedure, including recovering admin access when
nobody can sign in at all: `docs/RECOVERY.md`.

## Auth

Google sign-in only — there is no password login. `ADMIN_ALLOWED_EMAILS` is the only gate,
checked on every login path; an email not on that list is refused even if Google authenticates
it. Details and the recovery procedure: `docs/DECISIONS.md` §10, `docs/RECOVERY.md`.

## Payments

One interface (`src/lib/payment/paymentProvider.ts`): start a payment, confirm it, mark the order
paid. `mock` (demo/development only) and `paypal` (hosted checkout, sandbox credentials today) are
implemented. No sandbox purchase has been run end to end yet — see `docs/BACKLOG.md`.

## Public routes

`/`, `/en`, `/fr` — home. `/<ספרים|books|livres>` — catalogue. `/<ספר|book|livre>/<slug>` — a
book. `/courses`, `/donate`, `/questions-and-answers`, `/press` (redirects into `/rabbi-chriqui`),
`/privacy`, `/ramhal`, `/rabbi-chriqui`, `/beit-ramhal`, `/cart`, `/checkout`,
`/checkout/return/<token>`, `/order/<token>`, `/mock-payment/<providerRef>` (mock provider only)
— each prefixed per locale as above. `/admin` is the Payload admin; `/api/*` is Payload's REST and
GraphQL API plus `/api/diagnostics` and `/api/webhooks/paypal`.

## Admin structure

Collections: Books, Categories, Series, Lessons, Articles, Pages, Announcements, Events, Media,
Users, Carts, Orders, PaymentEvents, MockPaymentSessions. Globals: Schedule, ShippingSettings,
SiteSettings. Admin UI is Hebrew-only, one admin persona (`docs/DECISIONS.md` §3).

## Running it

```bash
nvm use
npm ci
cp .env.example .env   # fill in the values; see the file for what each one does
npm run db:migrate
npm run seed
npm run dev
```

`npm run seed` is safe to repeat — it creates missing defaults but never restores or overwrites
values an editor has since changed.

**`next dev` cannot render any admin page containing a Lexical `richText` field** — the page's DOM
is correct but nothing paints, a blank white screen. Every collection with a description/body
field is affected (Books, Articles, Pages, Announcements, Events, Series). Use
`next build && next start` to check rendering of any such page locally; this does not affect the
storefront.

## Database changes

Committed migrations are the only schema writer, in every environment, including development
(`push: false`).

1. Change the Payload collection/global configuration.
2. `npm run migrate:create -- descriptive_name` — routed through a Next.js dev route rather than
   Payload's own CLI, which cannot load this project's config under Node
   (`docs/DECISIONS.md` §15).
3. Read the generated TypeScript migration and JSON snapshot.
4. `npm run db:migrate` to apply it. Idempotent; refuses a database still carrying Payload's old
   schema-push marker.

## Required checks

Before committing:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Migration and seed scripts

`npm run import:books` and `npm run import:prepared-covers` write to whichever database
`DATABASE_URI` names — they print that database's fingerprint before writing anything, and there
is no automatic guard against it being production. `scripts/scrape/` is separate, one-time legacy
site scraping tooling (`scripts/scrape/README.md`) whose output these importers consume; it is
not part of the deployed application.

## Environment variables

Names only — see `.env.example` for what each one does and requires: `DATABASE_URI`,
`TEST_DATABASE_URI`, `SERVER_URL`, `PAYLOAD_SECRET`, `DEV_MIGRATE_SECRET`, `APP_ENV`, `S3_BUCKET`,
`S3_ENDPOINT`, `S3_PUBLIC_URL`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`,
`PAYMENT_PROVIDER`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`,
`PAYPAL_ENV`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_ALLOWED_EMAILS`,
`PAYPAL_DONATION_URL`, `BACKUP_S3_BUCKET`, `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`,
`BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY`.

## Deploying

`vercel.json` selects the Frankfurt function region and runs `npm run deploy:build`, which
applies pending migrations before `next build`. Set `APP_ENV` for the build, not only for runtime
— it's read while pages prerender, and the server refuses to start if the running `APP_ENV`
differs from the one it was built for.
