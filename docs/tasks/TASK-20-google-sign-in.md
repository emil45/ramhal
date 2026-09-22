# TASK-20 — Google sign-in for the Payload admin panel

Numbered TASK-20, not TASK-19: `docs/tasks/TASK-19-lesson-page-refinement.md` already exists as
uncommitted in-progress work (per `git status` at the start of this task) and is left untouched.

User request, verbatim goal: the son opens `/admin`, clicks one button, picks
`ramhalcom@gmail.com`, and he is in. No password in his life. Email+password stays enabled as a
break-glass path. Exactly two people may ever obtain a session. No recurring cost, nothing that
can lapse.

## Decided — implement, do not relitigate

- Payload's enterprise SSO product is rejected: negotiated pricing, and a licence that can lapse
  is exactly what DECISIONS §5/§10 rule out.
- Use `payload-oauth2` (WilsonLe), MIT, peer `payload ^3`, zero runtime deps, via `auth.strategies`
  — a first-party extension socket (`node_modules/payload/dist/auth/types.d.ts`). Pin the exact
  version, no caret: single-maintainer auth package, an upgrade is a diff to read.
- Add `jose` as a direct dependency — the plugin imports it while declaring no dependencies of its
  own; it lives off Payload's transitive copy today.
- Do not set `disableLocalStrategy`. Do not enable `useAPIKey` on Users.

## Who may log in — exactly two, both role `admin`

- `emil45@gmail.com` — Emanuel, developer, break-glass
- `ramhalcom@gmail.com` — the son, day-to-day administration, signs in with Google

Nobody else may obtain a session by any path, ever.

## Deliverables

- Google Cloud project `machon-ramhal`: branding (מכון רמח״ל), External audience published (not
  Testing), OAuth web client `ramhal-admin` with both redirect URIs registered, the son added as
  IAM Owner. Client secret never written to the repo, a doc, a report, a commit, or echoed
  terminal output.
- `src/lib/serverUrl.ts` — required `SERVER_URL`, validated (`http(s)://`, no trailing slash), with
  a colocated test.
- `src/lib/auth/googleSignIn.ts` — all-or-none config reader (`GOOGLE_CLIENT_ID` +
  `GOOGLE_CLIENT_SECRET`, following `src/lib/mediaStorage.ts`'s shape) and `getUserInfo`, which
  returns only `{ email }` and throws unless `email_verified === true`.
- `src/collections/hooks/allowOnlyListedAdmins.ts` — `Users.hooks.beforeLogin`, throws Payload's
  `Forbidden` unless the authenticating email is in `ADMIN_ALLOWED_EMAILS` (comma-separated,
  required, boot fails if unset/empty). Case- and whitespace-insensitive. This is the only gate,
  and it covers local login, the Google callback, and REST `/api/users/login` alike because
  `payload-oauth2`'s callback endpoint runs the same `beforeLogin` hook array before issuing a
  cookie (verified by reading `dist/callback-endpoint.js`).
- `payload.config.ts` — register the plugin with `onUserNotFoundBehavior: 'error'`,
  `pkceEnabled: true`, `useEmailAsIdentity: true`, `prompt: 'select_account'`, the three Google
  scopes, Google's authorization/token endpoints, `successRedirect` to `/admin`, `failureRedirect`
  to the login screen with a generic message.
- `admin.components.beforeLogin` — one link to `/api/users/oauth/authorize`, labelled
  "התחברות עם Google", Hebrew/RTL. Matching the existing admin-component convention
  (`src/components/admin/OrderQuickFilters.tsx`: plain element styled with Payload's own
  `--theme-*` CSS variables) rather than shadcn/Tailwind — verified the admin layout
  (`src/app/(payload)/layout.tsx`) imports only `@payloadcms/next/css`, not the app's Tailwind
  stylesheet, so shadcn components would render unstyled there. Registered in the import map.
- No migration — no schema change (confirm and state in the report).
- `.env.example` — document `SERVER_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `ADMIN_ALLOWED_EMAILS`, matching the existing explanatory style.
- Vercel production env vars set via CLI; local `.env` set for verification.
- DECISIONS §19: why the enterprise product was rejected, why this plugin was accepted, the four
  defences and what each defends against, that the local strategy is deliberately retained, and
  that this amends §3 (a second editor now takes an environment change plus redeploy, not just
  the admin UI).

## Verification

- `tsc --noEmit`, `eslint`, `vitest run`, `next build` — all must pass before any commit.
- Colocated tests: allowlisted email passes; non-allowlisted email rejected even with a matching
  user row; case/whitespace-insensitive comparison; unset/empty `ADMIN_ALLOWED_EMAILS` fails at
  boot; `getUserInfo` rejects `email_verified === false` and drops every field but `email`; the
  all-or-none config reader.
- Load `https://ramhal-theta.vercel.app/admin` first, before any other verification step — if it
  shows "create first user", stop and report before continuing.
- Exercise the real flow locally against the real Google client: sign in as the allowlisted
  account and reach `/admin`; then point `ADMIN_ALLOWED_EMAILS` at a different address and confirm
  the same account is refused.
- Report honestly which steps could not be performed.

## Non-goals / explicit constraints

- No Vercel preview-deployment support for Google sign-in (redirect URI is registered per exact
  URL) — document, don't work around.
- No workaround if `ADMIN_ALLOWED_EMAILS` is ever wiped — that fails closed for everyone,
  including Emanuel, and that is correct; document it.
- Stop and ask rather than guess if the Google Cloud console refuses a step, the Chrome tools are
  unavailable, the verification gate fails in a way that isn't fixable without changing a decision
  above, or anything here conflicts with `AGENTS.md`.
