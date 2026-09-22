# TASK-20 — Google sign-in for the Payload admin panel

## What was built

- Google Cloud project `machon-ramhal`, its own billing account (so it can be handed to the son
  separately from Emanuel's other projects), branding (מכון רמח״ל), audience published to
  production, OAuth client `ramhal-admin` with both redirect URIs, and the son added as IAM Owner.
- `src/lib/serverUrl.ts` — required `SERVER_URL`, validated, tested.
- `src/lib/auth/googleSignIn.ts` — all-or-none `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` reader;
  `getGoogleUserInfo`/`parseGoogleUserInfo` extract only `email` from Google's response and refuse
  it unless `email_verified` is `true`.
- `src/lib/auth/adminAllowlist.ts` + `exitUnlessAdminAllowlistIsSafe.ts` (wired into
  `src/instrumentation.ts`) — `ADMIN_ALLOWED_EMAILS`, required, boot fails if unset or empty.
- `src/collections/hooks/allowOnlyListedAdmins.ts` — the one `beforeLogin` gate, covering local
  login, the Google callback and REST `/api/users/login` alike.
- `payload-oauth2` registered in `payload.config.ts` (`onUserNotFoundBehavior: 'error'`,
  `pkceEnabled: true`, `prompt: 'select_account'`), pinned to `1.0.21` exactly; `jose` added as a
  direct dependency.
- `GoogleSignInLink` admin component, styled with Payload's own `--theme-*` variables (shadcn
  renders unstyled inside the admin panel — verified against the admin layout's imports).
- A minimal trilingual `/privacy` page — required to publish the OAuth consent screen out of
  Testing mode.
- **Mid-task reversal, at Emanuel's explicit instruction**: local (email+password) login is now
  fully disabled (`disableLocalStrategy: { enableFields: true }`). See "What felt wrong."
- `docs/DECISIONS.md` §19.

## What was verified and how

- `tsc --noEmit`, ESLint (0 errors; pre-existing generated-migration warnings only), all 214
  Vitest tests, and `next build` — all pass, before every commit.
- Read `payload-oauth2`'s compiled source directly (not just its README) for: how `beforeLogin`
  is invoked in the callback endpoint, exactly what `getUserInfo`'s return value is written with,
  and what `modify-auth-collection.js` does to the collection's fields — this is how the `sub`
  column requirement and the disabled-local-strategy behaviour were found, not assumed.
- Generated the migration for the `sub` column payload-oauth2 requires
  (`20260922_062811_google_sign_in.ts`) and applied it; generated a second migration to confirm
  the local-strategy change needs none, then deleted the empty file.
- Exercised the real flow against the real Google client, twice — locally and in production:
  signed in as `emil45@gmail.com` and reached `/admin`; then, locally, pointed
  `ADMIN_ALLOWED_EMAILS` at a different address and confirmed the same Google account was refused
  and sent back to the login screen with no error text leaked into the URL.
- Confirmed with the Neon MCP tools (not a guess) that production ends this task with exactly one
  `users` row (`emil45@gmail.com`, role `admin`, no password hash, `sub` still `null`).

## What felt wrong

- The brief said Google sign-in needs no migration; `payload-oauth2` adds a `sub` column
  unconditionally whenever enabled, regardless of `useEmailAsIdentity`, verified by reading its
  source. Flagged and confirmed with Emanuel before generating the migration.
- **Production briefly carried a live, empty `create-first-user` screen on a public URL.** This
  is not a bug in this task's code — `onUserNotFoundBehavior: 'error'` correctly refuses to
  auto-provision an account from Google, which means only a human completing `create-first-user`
  can ever seed the first row, and that screen is unavoidably live on a freshly deployed database
  with zero users. I flagged it and stopped rather than creating the account myself, per the
  brief. Emanuel completed it in the browser — with a password — and then also signed in with
  Google against the same row (`useEmailAsIdentity` matches by email, so this is one account, not
  two). He then asked, reasonably, why a password existed on a Google-only admin at all, and to
  remove the option entirely, not just that one credential. That reversed the original
  "local strategy is the deliberate break-glass path" decision from earlier the same task — see
  DECISIONS §19 for the trade this now costs: with local login off, an empty `users` table no
  longer falls back to `create-first-user` either (verified in `@payloadcms/next`'s admin root
  view), so a fully emptied table has no self-service recovery path at all.
- Cleared the stray password hash from that production row via a direct, explicitly-confirmed SQL
  `UPDATE` (Neon MCP) rather than leaving inert credential material sitting in the database.

## What is still open

- **`ramhalcom@gmail.com` has no `users` row yet.** With `onUserNotFoundBehavior: 'error'`, Google
  sign-in cannot create one — the son will get "user not found" until an existing admin creates a
  Users document for his email (role `admin`) from the admin panel. I did not do this myself;
  it's a two-minute step for Emanuel or done together with the son, and matches the brief's "the
  Rav does not use the system, his son does all administration" framing better as an action taken
  by the account being provisioned for, not seeded on his behalf.
- Google sign-in does not work on Vercel preview deployments (redirect URI is registered against
  the exact production URL); not worked around, by design.
- If `ADMIN_ALLOWED_EMAILS` is ever wiped in Vercel, or the `users` table is ever fully emptied,
  nobody can log in via any path, including Emanuel. Both are the correct failure direction
  (closed, not open) and are written down in DECISIONS §19.
