<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ramhal — rules

Rebuild of the web presence of מכון רמח״ל (Machon Ramhal), the publishing and teaching institute
built around the writings of the Ramhal (Rabbi Moshe Chaim Luzzatto, 1707–1746). Read
`README.md` and `docs/DECISIONS.md` before doing anything substantive — this file is rules, not
background.

## Non-negotiables

- **Hebrew is the default language at the root** (`/`), with `/en` and `/fr` prefixed. Build
  **RTL-first** using logical properties (`margin-inline-start`, never `margin-left`) so the LTR
  locales fall out of it. Do not retrofit RTL.
- **One catalogue, one content model, three languages.** Never clone content, a page, or a field
  per currency or per language. See `docs/DECISIONS.md` §2.
- **The Rav does not use the system.** His son does all administration. One admin persona.
- **`NODE_ENV` says how the build is optimised, `APP_ENV` says which deployment this is**
  (`development` | `demo` | `production`, required). Never gate behaviour on `NODE_ENV`.

## Quality bar

This codebase is handed to a human developer who has never seen it. That is the primary bar —
above cleverness, above speed.

**Architecture**

- Business logic lives in pure functions under `lib/`, independent of Next.js and Payload, and
  testable without booting either. Framework code calls that logic; it does not contain it.
- One responsibility per file. No abstraction until there are three real cases. No copy-paste
  either — extract on the third occurrence, not the first.

**Types**

- No `any`. No `as` casts to silence the compiler. Types derive from the Payload schema where
  possible rather than being hand-written twice.

**Naming and comments**

- Full words, no abbreviations a newcomer must decode.
- Comments explain WHY a non-obvious decision was made, never what the code does, and never
  reference a task number or this session's own fix — a comment outlives the task that wrote it.
  Delete a comment rather than let it go stale.

**What not to do**

- Files that each follow a different pattern because each was written in isolation. Match the
  conventions already in the repo.
- try/catch that swallows an error and continues. Handle it or let it throw.
- Dead code, commented-out code, unused imports or parameters, leftover `console.log`.
- Multiple utility modules that do overlapping things. Re-implementing something the framework
  already provides. Magic numbers and inline string literals for anything meaningful — name them.

**Storefront UI**

- No raw `<input>`, `<select>` or `<button>` in `src/components/storefront/` or under
  `src/app/(frontend)/`. Use the shadcn components in `src/components/ui/`. Check with
  `grep -rn "<input\|<select\|<button" src/components/storefront "src/app/(frontend)"`, which
  must print nothing.
- Logical CSS properties only (`ms-`, `ps-`, `start-`), never `ml-` / `left-`.
- Look and feel is in `docs/DESIGN.md`. Read it before touching a storefront component.

**Testing**

- Anything with rules gets tests: shipping calculation, currency handling, locale fallback, slug
  generation. Not UI. Tests describe behaviour, not implementation.

**Verification**

- A claim about production is established through the live URL or through what the running
  application reports about itself — never from a database tool connection alone, however it is
  labelled. See `docs/DECISIONS.md` §10.
- `GET /api/diagnostics` is public but narrow (`docs/DECISIONS.md` §11): an anonymous request gets
  `appEnv`, `builtForAppEnv`, `latestMigration`, `backup`, and `database.fingerprint` — compare
  that against the value recorded in `docs/RECOVERY.md`, never against a remembered host string.
  The full `database.host`/`database.name`/`database.user` only appear for an authenticated admin
  session.

**Commits**

- Small, single-purpose, conventional commits. A reviewer should understand what happened from
  the log alone, without reading diffs.

## Workflow protocol

- **One agent works in this repo at a time.** Confirm no one else is active before starting.
- Work comes from a brief in `docs/tasks/TASK-NN-description.md`. Emanuel assigns the number
  before the agent starts, and checks it is unused — task numbers have collided before.
- Every task ends by writing `docs/reports/TASK-NN.md` before reporting back in chat: what was
  built · what was verified and how · what felt wrong · what is still open. Short and structured,
  not a narrative. Any item still open when the report is written belongs in `docs/BACKLOG.md`,
  not only in the report.
- Reports are deleted at the next documentation reset once their open items are folded into
  `docs/BACKLOG.md` — they are not meant to accumulate indefinitely.
- Work happens directly on `main`. No task branches. `main` is pushed to `origin` at the end of
  every task — the remote is the safety net, not a local branch.
- Required checks run on the local PostgreSQL (`ramhal`, `ramhal_test`), never on Neon: `DATABASE_URI`
  and `TEST_DATABASE_URI` in `.env` are `localhost`, and the code refuses a Neon host for tests
  always and for development unless a one-off script sets `ALLOW_PRODUCTION_ONE_OFF=TASK-NN`. Refresh
  the local data with `npm run db:restore-local`. Neon's transfer allowance is shared by the whole
  project and its exhaustion takes the live site down (`docs/DECISIONS.md` §5).
- Nothing is committed that does not build and pass its tests. A commit that fails
  `tsc --noEmit`, `eslint`, `vitest` or `next build` is a commit that should not exist. Verify
  before committing, not after.
- A task that turns out wrong is undone with `git revert` across its commit range. Never
  force-push and never rewrite published history.
- Reviewers write findings only — they never change code, and their findings are not instructions
  to anyone. A verdict file decides what gets acted on.
- A script that mutates production data is committed under
  `scripts/one-off/TASK-NN-description.ts`, run once, and never deleted — a record of what
  actually executed, not a reusable tool. Get its connection string the way `docs/RECOVERY.md`'s
  "Running a one-off script against production" section describes. If a script that already ran
  cannot be reconstructed exactly, commit the closest faithful reconstruction with a header
  stating plainly that it is a reconstruction.
