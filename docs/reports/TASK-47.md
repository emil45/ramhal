# TASK-47 — Revalidate after commit, deny-list, one schema in every media mode

## 1. Revalidate after commit
`revalidateStorefront` now does `after(() => revalidatePath('/', 'layout'))` (`after` from `next/server.js`). Outside a Next request
`after` throws (`` `after` was called outside a request scope ``), so the `disableRevalidate` opt-out still applies unchanged.

**Docs read** (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`): "It can be used in Server Components …,
Server Functions, Route Handlers, and Proxy"; the callback runs "after the response (or prerender) is finished" and "will be executed
even if the response didn't complete successfully". Payload's admin writes go through its REST route handler. **The docs never mention
`revalidatePath` inside `after`**, so I read `next/dist/server/web/spec-extension/revalidate.js`: `revalidate()` needs the work store
(preserved for `after` callbacks) and rejects only `phase === 'render'`, `use cache`, `unstable_cache` and `generateStaticParams`
contexts — none applies. Then proved it live: `next start`, PATCH a book through `/api/books/:id`, the catalogue went `HIT` → `MISS` with
the new title on the next load; an announcement delete and a global save behave the same. No timing tricks.

**Test** (`revalidateStorefront.integration.test.ts`, "the moment of revalidation"): `after` is mocked to queue its callback. After
`payload.create` resolves it asserts `revalidatePath` was **not** called while the transaction was open, then runs the queued callback
and, from a different connection (`payload.db.pool`), asserts the committed row is visible. Mutation-checked: calling `revalidatePath`
inline in the hook fails it. Note the visibility probe alone is racy in that mutation (its query can land after the commit); the
"not called while open" assertion is the deterministic guard. Unit test covers deferral and the opt-out.

## 2. Deny-list
Hook added to Series, Articles, Lessons and the ShippingSettings global. Test (same file, "which content triggers storefront
revalidation"): over `await config`, every collection and global except `users, carts, orders, paymentEvents, mockPaymentSessions`
must have `revalidateStorefront` in `afterChange` (and collections in `afterDelete`), and those five must not. It skips slugs starting
with `payload-` (Payload's own preferences/locked-documents collections that sanitising adds). A new collection without the hook fails it.
DECISIONS §5 and README reworded.

## 3. media.prefix
Cause: `@payloadcms/storage-s3` only inserts `prefix` via `alwaysInsertFields` when the plugin is **disabled**; when enabled (read-only
*and* read-write here) `getFields` adds it only if a `prefix` option is set. So `alwaysInsertFields: true` never protected read-only or
read-write modes. Fix, one path: `prefix` is declared explicitly on `Media` (text, default `''`, hidden, read-only; the plugin keeps an
existing field), and `alwaysInsertFields` and its comment are removed. `payload-types.ts` regenerated (field order only).
**Proof** — `npm run migrate:create` in each mode produced an empty migration body (Payload's `// Migration code` placeholder) and a
snapshot differing from the last one only by `id`: read-only (`.env` as is), none (`S3_PUBLIC_URL=` empty), read-write (six dummy `S3_*`
variables, no connection made). All probe files deleted; no migration committed. BACKLOG item removed.

## Verification (local Postgres, no-Neon preload)
`tsc` clean; `eslint` 0 errors (50 warnings, unchanged); `npm test` 364/364; `npm run build` exit 0. Local data restored after the e2e
(title, contact email); throwaway admin row deleted.

## Still open
Nothing new. Older one-off scripts and the PENDING checks of `docs/reports/TASK-46.md` remain in `docs/BACKLOG.md`.
