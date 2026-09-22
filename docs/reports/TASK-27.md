# TASK-27 — Make the one database safe to work against

## What was built

- **`GET /api/diagnostics`**, public: `APP_ENV`, `BUILT_FOR_APP_ENV`, the connected database's
  host/database/user (never the password), the most recent applied migration, and the age of the
  most recent successful backup. Directly answers the question TASK-24 had no cheap way to ask.
  Added the verification rule to `AGENTS.md`.
- **Test isolation**: a new, long-lived Neon branch (`testing`, forked from production so the
  catalogue is realistic). `TEST_DATABASE_URI` is required to run the suite at all — never a
  fallback to `DATABASE_URI` — and `vitest.setup.ts` independently refuses to run if that variable
  resolves to production's own host.
- **The second backup mechanism**: `.github/workflows/backup.yml` runs `pg_dump` nightly against
  production's unpooled connection, gzips it, and uploads it to a dedicated, private Neon Object
  Storage bucket (`ramhal-backups`), keeping 14 days. `GET /api/diagnostics` reports the last
  dump's age through a separate, read-only credential. `.github/workflows/restore-drill.yml` is a
  manual, repeatable proof that the dump actually restores.
- **`docs/RECOVERY.md`** gained a full database-restore section (Neon's own instant restore first,
  the `pg_dump` mechanism second), alongside the existing admin-account procedure.
- **The `sub` field is hidden** from the Users admin form (`payload-oauth2`'s `subField` option).
- **`docs/DECISIONS.md` §21** records TASK-26's `PaymentRequest`/`cancelUrl` finding against §5.

## What was verified and how

- **The diagnostics route**: real integration tests against the real (testing-branch) database —
  reports the actual host/database/user, the actual latest migration, and never leaks the password,
  asserted directly against the raw response body, not by inspection.
- **The test-isolation guard, for real, not just by inspection**: pointed `TEST_DATABASE_URI` at
  production's actual connection string and ran the suite — it refused immediately, before a single
  test body executed. Confirmed via direct SQL afterward that production's most recent order
  predates this entire session, i.e. nothing from any test run — before or after this task — has
  landed there since it was created.
- **§3a, empirically, not from the marketing page**: this project is on Neon's **free** plan
  (`owner.subscription_type: "free_v3"`, confirmed via the Neon API). Its history window
  (`history_retention_seconds`) is **21600 — exactly 6 hours — and that is the free plan's hard
  maximum**, not a configurable choice; Neon's own documentation states free plans cap at 6 hours
  regardless of setting, Launch plans reach 7 days, Scale plans reach 30. Neon's own production
  recommendation is 7 days specifically "for protection against data loss that may go unnoticed for
  several days" — unreachable on this plan without a paid upgrade. This is the real, load-bearing
  reason the second mechanism (§3b) isn't optional hardening: a problem noticed the next morning is
  already outside what Neon's own instant restore can reach.
- **§3d, proven end to end, for real** — not simulated, not reasoned about. No `pg_dump`/`pg_restore`
  exists on this machine (checked: not on `PATH`, not in `/Applications`, no Homebrew, no Docker),
  and installing one from outside the already-trusted npm/apt ecosystem was avoided deliberately.
  Instead: pushed the two workflows, added their GitHub Secrets, and used `gh workflow run` (already
  authenticated, `workflow` scope) to run the real thing on GitHub's own Ubuntu runner:
  1. Triggered `nightly-database-backup` manually. It succeeded; confirmed via the Neon MCP tools
     that a real 43 KB `ramhal-2026-09-22T15-33-40Z.sql.gz` landed in the bucket — not assumed from
     the green checkmark alone.
  2. Created a fresh Neon branch forked from production, then `DROP SCHEMA public CASCADE` /
     `CREATE SCHEMA public` on it — confirmed via `information_schema.tables` that it held zero
     tables before restoring anything, so the drill could not pass by accident on inherited data.
  3. Set that branch's own (throwaway) connection string as a temporary GitHub secret
     (`RESTORE_DRILL_TARGET_URI` — a secret, not a plain workflow input, specifically so it's masked
     in the run log rather than appearing in plaintext) and ran `restore-drill` against it.
  4. It succeeded. Its own log shows `psql` querying the restored branch directly:
     **`books: 96`**, **`users: 2`** — the exact real counts, recovered from nothing but the dump.
  5. Deleted the throwaway branch and the temporary secret immediately after. Confirmed via SQL
     that production's own `books` count (96) was unaffected throughout.
- `tsc --noEmit`, ESLint (0 errors), Vitest (306 tests passing by the end, up from 288 at the start
  of this task), and `next build` — all pass, checked before every commit in this task.
- The `sub` field's `admin.hidden: true` was confirmed by resolving `payload.config.ts` directly
  (via `vite-node`, in an isolated worktree so as not to disturb a concurrent `next dev` process)
  and reading the merged field config — not by a browser screenshot, since the earlier TASK-24
  session already found the book-edit admin page renders blank to this session's screenshot tool
  for reasons unrelated to the actual page (confirmed there via network/console logs showing zero
  errors and a 200 on every request).

## What felt wrong

- **This task ran concurrently with at least one other session working on the same repository
  again** (as TASK-24 also found) — and this time it produced a real collision, not just an
  interleaving to work around carefully: another session independently used **TASK-26** for an
  unrelated homepage-news feature while this task's TASK-26 (the PayPal adapter, from the previous
  session) was already committed and pushed. Its report briefly overwrote mine on disk,
  uncommitted. Nothing was actually lost — my TASK-26 report was already safe in git history — but
  it was a live "two people wrote to the same path" moment, not a hypothetical one, and it needed a
  direct question to Emanuel rather than a unilateral pick between renumbering his work or mine.
  He chose to renumber the news-stream task (now TASK-28); resolved cleanly, but it's worth naming
  that **sequential task numbers, chosen locally by whichever session gets there first, are not
  actually safe under concurrent work** — the collision happened despite both sessions presumably
  each checking for their own number's availability, because neither could see the other picking a
  number at the same time.
- **Neon's free-plan history window being a hard 6-hour ceiling, not a default**, was a genuine
  surprise reading the actual documentation rather than assuming "point-in-time restore" meant
  something closer to what Neon itself recommends for production (7 days). §14 named "Managed
  Postgres backups" as one of two mechanisms without ever specifying how far back that actually
  reaches — an assumption that turned out to be substantially weaker than it read.
- **Proving the restore required building a second, small, purpose-built GitHub Actions workflow**
  (`restore-drill.yml`) that isn't itself part of the backup mechanism §14 asked for — it exists
  purely because this session had no local `pg_dump`. That turned out to be a genuine improvement
  over what was originally planned (a one-time manual proof, done once and never repeatable): it's
  now a standing, re-runnable drill, not a claim that expires the moment the environment that
  produced it changes. Worth keeping as a real capability, not just an artifact of an environment
  limitation.

## What is still open

- **Sequential, session-local task numbering has no real collision protection**, as this task's own
  experience just demonstrated. Worth a lightweight fix — a single running counter file, or a
  convention of claiming a number by committing the brief file immediately rather than batching it
  with other work — but that's a process change for whoever owns the workflow protocol, not
  something to decide unilaterally here.
- **The restore drill restores into a branch that still lives in the same Neon project as
  production.** That's consistent with how "testing" is already scoped (TASK-24 §20) and the drill
  deletes its branch immediately after, but a true disaster-recovery drill — proving recovery
  survives *this Neon project itself* being unavailable — would need to restore into a different
  Neon project, or a different provider entirely. Not attempted here; §14's "two mechanisms" is
  about surviving one mechanism's failure, not surviving Neon itself being gone, and conflating the
  two would have been scope creep on this task.
- **`ADMIN_ALLOWED_EMAILS`, `PAYPAL_*`, and other genuinely sensitive variables are not exposed by
  `/api/diagnostics`** — deliberately, verified by the route's own test asserting the password never
  appears — but this is worth a second reviewer's eyes given the route is public: the judgment that
  host/database/user/migration-name/backup-age are all safe to expose is this session's own
  reasoning, not an external security review.
- **A note for whoever next runs `restore-drill.yml` for real**: it requires
  `RESTORE_DRILL_TARGET_URI` to be set as a GitHub secret pointing at a throwaway branch's
  connection string first (`docs/RECOVERY.md` has the steps) — running it without that secret set
  fails loudly (confirmed: the workflow's own guard step checks for it explicitly) rather than
  doing anything to production, but it is a manual step outside this repository each time.
