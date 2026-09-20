# TASK-12 — Deploy the demonstration site on Vercel Hobby

User request: continue the paused deployment work, changing the target from Railway to
Vercel's free Hobby plan for the demonstration. The future live shop will move to Pro.

## Deliverables

- Keep PostgreSQL schema changes migration-only in every environment. Finish the standalone,
  idempotent migration runner and use it before Vercel builds.
- Keep local media on disk, but make deployed media durable in S3-compatible object storage
  through Payload's adapter. Use Neon Object Storage for the free demo; keep the configuration
  portable to Cloudflare R2 for the full media archive. Uploads must bypass Vercel's request-size
  limit and public media must be served directly from the bucket's public URL.
- Do not seed from Payload's application lifecycle: a serverless instance may initialise many
  times. Provide an explicit, repeatable seed command instead.
- Configure Vercel's supported Node 22 runtime, document all environment variables and the
  demo-to-production transition, and update the hosting decision.
- Deploy a working `APP_ENV=demo`, `PAYMENT_PROVIDER=mock` demonstration if the existing Vercel
  login and the previously created Neon demo database are accessible.
- Import the catalogue from this machine only after the deployed schema and storage are ready.

## Constraints

- Do not enable real payments. Hobby is only the temporary demonstration target.
- `DEV_MIGRATE_SECRET` must never be present on Vercel.
- Preview deployments must not migrate or write to the production database.
- Never depend on Vercel's ephemeral filesystem for uploaded media.
- No migration, seed, catalogue import or media processing may run through an HTTP request.
- Preserve unrelated work in the shared working tree.

## Verification

- Prove a fresh database reaches the current schema using only committed migrations, and that a
  second migration run is a no-op.
- Prove the explicit seed is repeatable and does not overwrite edited values.
- Run TypeScript, ESLint, Vitest and `next build` before committing.
- Smoke-test the deployed Hebrew root, `/en`, `/fr`, `/admin`, catalogue and mock checkout flow.
- Write `docs/reports/TASK-12.md`, commit directly to `main`, and push `origin/main`.
