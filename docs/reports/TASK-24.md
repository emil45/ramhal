# TASK-24 — Close out Google sign-in: provision the son, correct the record, fix the import script

## What was built

- **The son provisioned.** `ramhalcom@gmail.com`, role מנהל (admin), created through the real
  `/admin` UI (not direct SQL) — twice, in fact, once before item 5 below was discovered and once
  after, both through the UI. Production now has two admin users.
- **A wrong assumption in three prior tasks, found and corrected.** TASK-20/22/23 all verified and
  repaired "production" through the Neon MCP tools against the project named `Ramhal`
  (`lucky-field-60207292`). The live site's actual `DATABASE_URI` pointed at a different project,
  `ramhal-demo` (`dawn-sun-46089061`), sitting at the pre-repair state the whole time. Resolved —
  at Emanuel's explicit instruction, given directly in this session — by making
  `lucky-field-60207292` the one production database everywhere (Vercel, local `.env`, tests) and
  deleting `ramhal-demo`. Full reasoning in `docs/DECISIONS.md` §20.
- **`scripts/import-books.mjs` and `scripts/import-prepared-covers.mjs` fixed** to run through
  `vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2` instead of plain `node`,
  reusing `vitest.config.ts`'s existing dependency-inlining fix for the exact same problem.
- **`docs/reports/TASK-23.md` corrected** (not rewritten) — its claim that `scripts/migrate.mjs` was
  "likely broken the same way" is false; only `import-books.mjs` was affected.
- **Google sign-in is now required, not optional**, in every environment. `readGoogleSignInConfig`
  no longer returns `null`; boot fails loudly (`exitUnlessGoogleSignInIsSafe`) if
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are unset. `disableLocalStrategy` is not made
  conditional on `APP_ENV` — see "What felt wrong."
- **Three of TASK-22's four duplicate-book merges encoded** as data
  (`REVIEWED_DUPLICATE_IMPORT_KEY`), so a from-scratch import reproduces them; `upsertBook` now
  also merges in a missing price currency on re-import, not just legacy URLs. The fourth is
  explicitly not encoded — `docs/DECISIONS.md` §20 has the reasoning.
- **`scripts/one-off/` convention established** in `AGENTS.md`, and TASK-22/23's production-mutating
  work reconstructed there as faithfully as the record allows.
- **`docs/RECOVERY.md`** — the procedure for an empty `users` table, a lost Google account, or a
  deleted OAuth client.

## What was verified and how

- **The database mismatch**, empirically: created the son's user through the live admin UI and
  watched it land in `ramhal-demo`'s `scratch1` database, not `lucky-field`'s default database —
  confirmed via direct Neon MCP queries against both, not inferred. Cross-checked book counts and
  category breakdowns against both projects to confirm which one matched TASK-22/23's documented
  "before" and "after" states.
- **The consolidation**, end to end: ran `npm run import:prepared-covers` (fixed) against
  `lucky-field` for real — 11 media created, 11 books attached, matching the 11 real uploaded
  covers that existed only in `ramhal-demo`'s bucket. Issued fresh scoped storage credentials and a
  new `ramhal-media` bucket on `lucky-field`'s branch. Updated `DATABASE_URI`/`S3_*` in Vercel's
  Production environment, redeployed, and confirmed via the live `/admin` UI and direct SQL that
  the son's account, all 96 categorized books, and all 11 covers are present and loading
  (`GET .../divrot-05-mashiach.png` → 200, verified via the browser's own network log, not assumed).
  Deleted the `ramhal-demo` project only after this.
- **The `vite-node` fix**, twice: once as a smoke test (deliberately empty `DATABASE_URI`, confirming
  the process gets past `payload-oauth2`'s resolution and fails on the *next* thing instead); once
  for real, against a scratch Neon branch forked from `lucky-field` (`npm run import:books`) — not
  production. This run surfaced a real, pre-existing bug unrelated to the fix: the first
  `confident`-bucket candidate ('תיקונים חדשים') failed with a Postgres slug-uniqueness violation
  despite an existing book already carrying that exact `importKey` — the existing-row lookup didn't
  match it, for a reason not diagnosed here (out of this task's scope). Recorded, not fixed. The
  scratch branch was deleted afterward.
- **The duplicate-merge overrides**: the three encoded pairs' exact `importKey`s were confirmed by
  cross-referencing `scripts/scrape/out/reconciliation.json`'s `ambiguous`/`confident` buckets
  against the surviving production books' `import_key` columns directly (SQL), not guessed from the
  TASK-22 report's prose alone. `newPriceRowsFor` and the `importKey` remap are unit tested.
- **The recovery procedure**, mostly end to end: created a real Neon branch from `lucky-field`,
  emptied its `users` table, ran the exact `INSERT` from `docs/RECOVERY.md`, confirmed the row via
  direct SQL. Booted the app against that branch (in an isolated `git worktree`, so as not to
  disturb Emanuel's own `next dev` running concurrently in the main working tree against
  production) — clean boot, correct Hebrew login screen, route protection redirects an
  unauthenticated visitor to it. The OAuth authorize step correctly redirected to Google with the
  right client/scope/PKCE. **Not verified**: the final callback round-trip. The OAuth client's
  redirect URI is fixed to `localhost:3000`, which was occupied by Emanuel's own session; adding a
  temporary redirect URI to complete the test was blocked by this environment's own security
  policy (flagged as weakening security), and not worked around. What's left unproven specifically:
  that Google's callback, handed a valid code, correctly matches the inserted row by email and
  issues a session — the code path for that (`useEmailAsIdentity`, `allowOnlyListedAdmins`) was read
  and reasoned through but not executed against this row.
- **Hebrew/RTL, for the non-technical operator** (this task's other deliverable): the admin UI is
  genuinely in Hebrew and reads correctly right-to-left throughout — sidebar on the right, checkbox
  column on the left, table columns right-aligned, dates in Hebrew month names. One rough edge: the
  `sub` field (from `payload-oauth2`, never read, see `docs/DECISIONS.md` §19) shows its raw English
  field name "Sub" in the Users form instead of a Hebrew label — cosmetic, but exactly the kind of
  thing that would confuse someone who doesn't already know it's safe to ignore. A second, milder
  one: the books list, when fetched at `limit=200`, showed "טוען..." (loading...) stuck in the
  category column for most rows — confirmed via direct SQL that the underlying data is correct
  (0 uncategorized), so this reads as a front-end relationship-population quirk at that page size,
  not a data problem; the default page size (10) didn't reproduce it.
- `tsc --noEmit`, ESLint (0 errors, only the pre-existing generated-migration warnings), all 254
  Vitest tests (including the real-database integration suite, run against the now-single
  production database), and `next build` — all pass, run after every change in this task, not just
  once at the end.

## What felt wrong

- **The database mismatch is the real finding of this task**, and it invalidates a specific,
  narrow claim in TASK-20/22/23: not that their code changes were wrong, but that their
  Neon-MCP-verified "production now has X" statements were checking a database nobody's browser
  ever reached. Practically, this had already mostly self-corrected by the time this task ran —
  Emanuel's own local development and testing had independently been pointed at `lucky-field` all
  along (confirmed: local `.env`'s `DATABASE_URI` already resolved there, unprompted, before this
  task touched anything), so the *data itself* was right; only Vercel's deployed environment was
  wrong. Still, three tasks' worth of "verified against production" text needs reading with that in
  mind.
- **This task ran concurrently with Emanuel actively developing in the same working directory** —
  discovered mid-task via a stray untracked image file, then confirmed by new commits landing on
  `origin/main` in real time (a money-units migration, a Hebrew i18n pass, a news-band feature) and
  by his own `next dev` occupying port 3000 throughout. Nothing of his was touched, overwritten, or
  committed on his behalf — every `git add` in this task named specific files, never `-A` or `.`,
  and one accidental interleaving (his uncommitted `seed:demo-news` npm script landing on the same
  lines as this task's edits to the two adjacent script entries) was untangled by hand before
  committing so his line stayed uncommitted and unattributed to this task. Worth naming plainly:
  this is not how the workflow protocol assumes work happens, and it made ordinary verification
  (which `next dev` is even being tested, which database a given query is really hitting) harder
  and slower than it needed to be.
- **Consolidating to one production database is a real, felt cost**, not a free cleanup. It was
  Emanuel's explicit instruction, given in this session after being shown the mismatch and asked
  how to proceed, and it was carried out — but integration tests now write to and clean up from the
  same database the public site serves, on every local test run, with no staging tier in between.
  This was not hypothetical: a concurrent test run (Emanuel's) left two `ספר בדיקה` fixture rows
  sitting in production for the few seconds between their creation and that test's own teardown,
  observed directly via SQL while this task was in progress. The teardown ran cleanly and nothing
  was left behind, which is the only reason this is a note rather than an incident — but it is the
  kind of thing that becomes an incident the day teardown fails, or the day real customers are
  present to see a stray row.
- **The recovery drill's incomplete proof bothers me more than the other gaps in this report.**
  Everything up to the Google callback was verified for real, against a real emptied clone of
  production, not simulated — but "the exact SQL produces a row the login flow accepts" is a claim
  built from reading the matching code correctly, not from watching a browser actually get a
  session. That is a meaningfully weaker claim than TASK-20's original proof (which did exercise a
  real callback, against production, before this task's consolidation work even started), and it's
  the one item in this report I'd want re-verified by someone who can either free `localhost:3000`
  or is willing to add and remove a Google Cloud redirect URI themselves.

## What is still open

- **The Google callback step of the recovery drill**, specifically — see above. Re-running it needs
  either a free port 3000 or a temporary OAuth redirect URI; this session couldn't do the latter
  and didn't want to disrupt the former.
- **A real, pre-existing bug in the import pipeline**, surfaced but not fixed: `upsertBook`'s
  existing-`importKey` lookup did not find a book whose `importKey` matches the candidate's exactly
  (confirmed via direct SQL equality), causing an attempted `create` that then failed on a slug
  collision. Seen once, on the first `confident`-bucket candidate, on a scratch branch; not
  diagnosed further, since it wasn't a product of this task's changes and diagnosing it thoroughly
  wasn't in scope. Worth a focused look before `import:books` is trusted for a real from-scratch
  rebuild.
- **The `sub` field's untranslated "Sub" label** in the Users admin form — cosmetic, not fixed here.
- **The books-list "טוען..." (loading) rendering at `limit=200`** — confirmed to be a display
  artifact, not a data problem, but not root-caused or fixed.
- **A preview deployment still cannot authenticate at all** — `docs/DECISIONS.md` (the paragraph
  amended in this task, just above §20) already says so; not new, not addressed here, and now
  correctly no longer described as falling back to a password path that doesn't exist.
- **APP_ENV is still `demo`** on the live, now-single-database site, carrying the permanent "no real
  payment is taken" banner. Not touched in this task — flipping it to `production` requires a real
  payment provider configured first (`PAYMENT_PROVIDER=mock` is currently refused under
  `APP_ENV=production`), which is a separate, larger piece of work, not something to change as a
  side effect of a database consolidation.
