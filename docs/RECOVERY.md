# Recovering admin access

This is for the moment nobody can sign in to `/admin` at all. Read the whole page before typing
anything — the fix depends on which of the two situations below you're actually in.

There is no password login on this site. The **only** way into `/admin` is "Sign in with
Google," and Google will only let someone in if their email address is on an allow-list stored in
Vercel. That is normally exactly the right amount of friction — but it means there are two
different ways to be locked out, and they need different fixes.

## Situation A: "Sign in with Google" shows a real error (not just "user not found")

This means the connection to Google itself is broken — the app can't reach Google, or Google
doesn't recognize this app anymore. Go to
**[Google Cloud Console](https://console.cloud.google.com)**, sign in with whichever Google
account owns this (the institute's own account, not a personal one — check with whoever set this
up if unsure), and open the project named **`machon-ramhal`**. Under **APIs & Services →
Credentials**, there should be an OAuth 2.0 Client ID named **`ramhal-admin`**. If it's missing,
been deleted, or its secret was rotated, that's the problem: recreate it (or generate a new
secret) and update `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in Vercel to match (see the Vercel
section below for where). Make sure its authorized redirect URIs still include the live site's
own domain.

## Situation B: Google sign-in succeeds, but you land back on the login screen, or the site says
## there's no user with that email

This means the *database* has no matching row — either the `users` table is completely empty
(nobody at all can get in, including whoever normally can), or your specific email just isn't on
it yet. If it's the latter — someone else can already get in — the fix is easy and needs no SQL:
ask an existing admin to add you from inside `/admin` → Users, the same way any admin adds anyone.

If the `users` table is **completely empty**, nobody can create that first row through the app —
Google sign-in deliberately refuses to invent an account for someone it doesn't already recognize,
which is what keeps a stranger who merely guesses the site out. Someone has to insert the first
row directly into the database. That is the rest of this page.

### 1. Get a database connection

You need a Postgres connection string for the live database (`DATABASE_URI` in Vercel's
Environment Variables for this project — see the Vercel section below for exactly where, though
note its value can't be viewed there once set; ask whoever manages the Neon project for a
connection string with write access, or open the database directly through the
[Neon console](https://console.neon.tech)).

### 2. Insert an admin row

Run this against that database, with the real email address in place of the placeholder (keep the
quotes, and use the same email you'll sign in to Google with):

```sql
INSERT INTO users (email, role) VALUES ('someone@example.com', 'admin');
```

That's the whole insert — every other column either has a default or is allowed to be empty.
`role` must be exactly `admin` or `editor` (lowercase); use `admin` to get full access back.

### 3. Sign in

Go to the site's `/admin` URL and sign in with Google, using that exact email address. You should
land in the admin panel with full access.

## What must already be true in Vercel for any of this to work

Open **[vercel.com](https://vercel.com) → the project → Settings → Environment Variables**. These
five must all be set (all of them show as "Sensitive," meaning nobody — not even someone with full
account access — can view their current value again once saved; if one needs replacing, you
overwrite it, you don't read it first):

- `DATABASE_URI` — must point at the database you just inserted the row into.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — from the `ramhal-admin` OAuth client in Google
  Cloud Console (see Situation A above for where to find or recreate these).
- `SERVER_URL` — the site's own public URL, no trailing slash. Google checks this against what's
  registered on the OAuth client, so if one changes, so must the other.
- `ADMIN_ALLOWED_EMAILS` — a comma-separated list of every email address allowed to sign in at
  all, checked on every sign-in regardless of what's in the database. The email you inserted above
  must be in this list, or Google will authenticate you successfully and the site will still
  refuse you. If this variable itself is ever deleted or emptied, the site refuses to start at
  all, for anyone — that's deliberate, but it's a way to lock everyone out including someone who
  otherwise has full access to everything else.

If any of these five is missing, the site will not start, and none of the above will get you in
until it's restored.

---

# Recovering the database itself

This is for the moment the *data* is wrong or gone — a bad migration, a mistaken bulk edit, a
corrupted table — not just admin access. There are two independent, unrelated ways to get an
earlier copy of the database back. Try them in this order.

## Situation A: the problem happened less than a few hours ago

Neon (the database host) keeps enough history to restore the whole database to any point in the
last several hours by itself, without needing a backup file at all. Check
`GET /<the live site's URL>/api/diagnostics` first — as of TASK-31 it's public but narrow
(AGENTS.md's verification rule, docs/DECISIONS.md §22): it reports `database.fingerprint`, a
short hash of the connection host, not the host itself. Compare it against **`2c951382a7f8`**,
recorded here as production's own fingerprint (`ep-red-tree-b19ry3lo-pooler…`) — a match confirms
the live site is still serving from the branch named **production** below. Sign in to `/admin`
first if you need the actual host: the response includes it for an authenticated admin session.

1. Go to **[console.neon.tech](https://console.neon.tech)** and open the project.
2. Open the branch named **production**, then **Branches → Restore** (Neon calls this "Instant
   restore").
3. Pick a timestamp from before the problem happened, and confirm.

**How far back this can reach depends on the plan, and is worth checking before relying on it** —
open the project's **Settings → Postgres → History window** to see the current number, in the
Neon console; do not assume it is longer than it says. As of writing (docs/reports/TASK-27.md
§3a), this project is on Neon's free plan, whose history window **cannot exceed 6 hours**, no
matter how it's configured — a problem noticed the next morning is already outside it. That is
exactly what Situation B is for.

## Situation B: it's been longer than that, or Situation A's window has already passed

A separate, independent copy exists outside Neon entirely: a nightly `pg_dump` uploaded to its own
object storage bucket (`.github/workflows/backup.yml`), kept for two weeks. This is slower and
more manual than Situation A, but it doesn't depend on Neon's own history at all — a problem with
Neon's infrastructure, not just this database's history window, can't take out both copies at
once.

**Never restore directly into the live database.** Always restore into a brand new, empty branch
first, and only point the live site at it once you've confirmed it's actually correct — restoring
onto the real database, sight unseen, turns "the data might be wrong" into "the data is definitely
gone."

### 1. Find the dump to restore

The bucket is private (not a public URL) — you need a connection to Neon Object Storage. Ask
whoever manages the Neon project for read access to the `ramhal-backups` bucket (Neon console →
the project → **Storage** — the endpoint, region and bucket name are also all visible there), or
for the dump file itself. Files are named `ramhal-<UTC timestamp>.sql.gz` — pick the most recent
one from before the problem happened. `GET /api/diagnostics` reports how old the *most recent*
dump is (`backup.ageHours`), which tells you whether last night's dump already contains the
problem or not.

### 2. Create a fresh, empty branch to restore into

In the Neon console: the project → **Branches → Create branch**. Give it a clearly temporary name
(e.g. `restore-check-2026-09-22`) so nobody mistakes it for anything permanent. Get its connection
string (**Connect** on that branch) — use the **unpooled** one (no `-pooler` in the hostname).

### 3. Restore

On a machine with PostgreSQL's client tools installed (`pg_restore`/`psql` — these are not part of
this repository or its dependencies; install PostgreSQL itself, or use `apt`/`brew` if available):

```bash
gunzip -c ramhal-<timestamp>.sql.gz | psql "<the new branch's unpooled connection string>"
```

### 4. Confirm it's actually right before trusting it

Point a local copy of the app at that branch's connection string (`DATABASE_URI` in a local
`.env`, temporarily) and start it (`npm run dev`). Sign in to `/admin` with an account you expect
to exist, and check the books collection has the catalogue you expect. Only once this looks right
should the branch's connection string ever be considered for promoting to the live `DATABASE_URI`
— and that promotion is a decision for whoever owns the deployment, not a mechanical step.

### 5. Clean up

Delete the temporary branch once you're done with it (Neon console → the branch → delete), whether
or not you used it — an unused branch is easy to forget and costs nothing to remove immediately.
