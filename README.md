# Ramhal

The multilingual website, catalogue and administration application for מכון רמח״ל.
Hebrew is served at `/`; English and French are served at `/en` and `/fr`.

The application is Next.js 16 and Payload 3 in one process, backed by PostgreSQL.
Read `docs/PROJECT_CONTEXT.md` and `docs/DECISIONS.md` before changing the content
model or deployment architecture.

## Local setup

Use Node 22.23.2 (`.nvmrc` records the development version), PostgreSQL, and npm.

```bash
nvm use
npm ci
cp .env.example .env
```

Fill in `.env`, then initialise the database and start Next:

```bash
npm run db:migrate
npm run seed
npm run dev
```

The seed is safe to repeat: it creates missing defaults but never restores or
overwrites values subsequently edited in the admin.

## Database changes

Committed migrations are the only schema writer, including in development.

1. Change the Payload collection/global configuration.
2. Run `npm run migrate:create -- descriptive_name`.
3. Read the generated TypeScript migration and JSON snapshot.
4. Apply it with `npm run db:migrate`.

`db:migrate` is idempotent. It deliberately refuses databases carrying Payload's
old batch `-1` development marker, because those databases were built by schema
push and cannot safely establish which committed migrations have run.

## Vercel demonstration

The temporary public demonstration runs on Vercel Hobby. `vercel.json` selects
Vercel's Frankfurt function region and runs `npm run deploy:build`; that command
applies pending migrations before `next build`. The live shop must move to Vercel
Pro before real payments are enabled.

Set these for the Vercel **Production** environment:

```text
APP_ENV=demo
PAYMENT_PROVIDER=mock
DATABASE_URI=<pooled Neon connection string; hostname contains -pooler>
PAYLOAD_SECRET=<random secret>
S3_BUCKET=<S3-compatible bucket>
S3_ENDPOINT=<S3 API endpoint>
S3_PUBLIC_URL=<public bucket or media origin>
S3_REGION=<bucket region>
S3_ACCESS_KEY_ID=<scoped key>
S3_SECRET_ACCESS_KEY=<scoped secret>
```

Never set `DEV_MIGRATE_SECRET` on Vercel. Preview deployments should have their
own Neon database and storage credentials; if they do not, leave `DATABASE_URI`
unset so the preview build fails instead of touching the demonstration database.

The demo uses the `ramhal-media` bucket in Neon Object Storage, colocated with
the demo database. Payload uploads directly from the authenticated admin browser
to the S3-compatible bucket, whose CORS policy accepts `GET`, `HEAD`, and `PUT`
from localhost and `https://*.vercel.app`. Files are public and served from
`S3_PUBLIC_URL`; database records and writes remain protected by Payload. The
same variables can point to Cloudflare R2 before the larger MP3 archive moves.

Seed and catalogue import are explicit local operations, not Vercel Functions.
Export the demo `DATABASE_URI` and `PAYLOAD_SECRET` before both commands; export
all six demo `S3_*` values before the catalogue import so its covers go to
durable storage. Vercel does not export sensitive values back to the CLI, so use
a separately scoped Neon storage credential for local imports.

```bash
npm run seed
npm run import:books
```

The catalogue importer reads the local scrape output, which is intentionally not
committed. Run it from a machine that holds that source data.

## Required checks

Before committing:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Each numbered task ends with a report under `docs/reports/`; see
`docs/README.md` for the task and review workflow.
