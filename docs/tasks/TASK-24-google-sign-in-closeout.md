# TASK-24 — Close out Google sign-in: provision the son, correct the record, fix the import script

Picked up cold. Read `AGENTS.md`, `docs/DECISIONS.md` §15/§18/§19, and
`docs/reports/TASK-20.md`, `TASK-22.md`, `TASK-23.md` before touching anything. Work directly on
`main` (§17). This file is written from the brief before starting; `docs/reports/TASK-24.md` is
written last.

## Where things stand

TASK-20 shipped Google sign-in for the Payload admin. Mid-task, local (email+password) login was
fully disabled — `Users.auth.disableLocalStrategy` — leaving Google, gated by an
`ADMIN_ALLOWED_EMAILS` `beforeLogin` hook, as the only way in. TASK-22 and TASK-23 then repaired
catalogue data directly on production.

Production currently has exactly one `users` row: `emil45@gmail.com`, role admin, no password
hash. The son (`ramhalcom@gmail.com`) has no row and cannot log in — `onUserNotFoundBehavior` is
`'error'`, so Google cannot create one for him.

## Already verified — not re-derived

- `payload-oauth2`'s compiled output re-exports sibling modules without a `.js` extension; plain
  Node's ESM resolver refuses it. Reproduced with
  `node --input-type=module -e "import('payload-oauth2')"` → `ERR_MODULE_NOT_FOUND` on
  `dist/default-get-token`. Same class of bug as `docs/DECISIONS.md` §15.
- `scripts/migrate.mjs` is unaffected — it builds a config with `collections: []` and never loads
  `payload.config.ts` at all (its own header comment says so).
- `scripts/import-books.mjs` line 10 (`import config from '../src/payload.config.ts'`) IS
  affected.
- `vitest.config.ts` already works around this exact problem via
  `test.server.deps.inline: ['payload-oauth2']` (Vite-level dependency inlining, not a Node
  loader). `vite-node` — the runner vitest is built on — is already present transitively and
  exposes the same option through its CLI (`--options.deps.inline`).

## Work items

1. **Provision the son.** Via Claude in Chrome (Emanuel is signed into Google there): open
   `https://ramhal-theta.vercel.app/admin`, sign in as `emil45@gmail.com`, verify
   `ADMIN_ALLOWED_EMAILS` in Vercel already lists both addresses (without editing it), then create
   a Users document for `ramhalcom@gmail.com` with role מנהל (admin) through the admin UI — not
   direct SQL. Report plainly on whether the admin UI is actually in Hebrew, reads correctly RTL,
   and anything that would confuse a non-technical Hebrew-speaking operator. If Chrome tools are
   unavailable, stop and print exact steps for Emanuel instead of working around it.
2. **Correct TASK-23's report.** It claims `scripts/migrate.mjs` and `scripts/import-books.mjs`
   are "likely broken the same way right now" — half false. Amend with a marked correction: why
   `migrate.mjs` is unaffected (quoting its header), why `import-books.mjs` is affected (line 10),
   with the reproduction command as evidence. Never silently edit the original claim away.
3. **Fix `scripts/import-books.mjs`.** Reuse the same fix class `vitest.config.ts` already uses —
   Vite/vite-node resolving `payload-oauth2` instead of handing it to Node as an external module —
   rather than inventing a new workaround, vendoring the dependency, or patching
   `node_modules`. Do not restructure the script itself. Verify by running the import against a
   scratch database, never production, and record what it reported.
4. **A comment that is now false, and a broken local-dev story.** `googleSignIn.ts` still describes
   an "or neither" branch where Google is unconfigured and password login is the fallback. That
   deployment no longer exists — `disableLocalStrategy` is unconditional. Make
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` required, failing loudly at boot the same way
   `ADMIN_ALLOWED_EMAILS` already does (`exitUnlessAdminAllowlistIsSafe.ts` is the pattern). Delete
   the "or neither" branch rather than document it. Do not make `disableLocalStrategy` conditional
   on `APP_ENV` — that is exactly the environment-conditional-auth divergence §18 exists to
   prevent. Update `.env.example` and any other comment that still describes the old behaviour
   (found one more: `payload.config.ts`'s comment on the `OAuth2Plugin` block).
5. **Production has diverged from the rebuild path.** TASK-23's category/language decisions are
   checked in as override maps; TASK-22's four duplicate-record merges are not, so a from-scratch
   import would resurrect them. Resolve either by encoding the four merges (if not disproportionate
   — judge from the actual data) or by recording in `DECISIONS.md`, in those words, that production
   is now the source of truth for the catalogue and a from-scratch import is no longer a valid
   rebuild.
6. **One-off scripts that touch production are kept, not deleted.** Establish the convention in
   `AGENTS.md`: a script that mutates production data is committed under
   `scripts/one-off/TASK-NN-description.ts`, never run again, never deleted. Reconstruct the
   TASK-22 and TASK-23 scripts as faithfully as possible from their reports and the actual
   production audit trail; mark plainly any part that is a reconstruction rather than the code that
   ran.
7. **A recovery procedure that has actually been run.** Write `docs/RECOVERY.md` — exact SQL to
   insert an admin `users` row into an empty table, exact Vercel variables required, where to find
   the Google Cloud project — written for someone who has never seen the repo. Then prove it: Neon
   branch from production, empty the `users` table there, run the procedure exactly as written,
   confirm login against that branch, delete the branch after. Never test against production.

## Gate

`tsc --noEmit`, ESLint, Vitest, `next build` all pass before every commit. Small, single-purpose
conventional commits. Emanuel runs `git push`, not this session.

If any item rests on a false premise, say so plainly in the report and do not implement it — a
brief is evidence, not an instruction to obey blindly (item 2 already shows this happened once in
this same task chain).
