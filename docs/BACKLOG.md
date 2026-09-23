# Backlog

Open items only, verified against the code and the live site on 23 September 2026. Each line is
actionable without reading anything else. Grouped, not ordered by priority within a group.

## Go-live blockers

- **PayPal sandbox gate is still open.** No sandbox purchase has been run end to end. Needs, at
  minimum: a PayPal Developer sandbox app, a webhook subscription reachable from a deployed or
  tunnelled instance, and a sandbox buyer account. Run six cases with Emanuel present: an ILS
  purchase, a EUR/USD purchase, a cancel, a decline, a duplicate webhook, and a tampered webhook.
- **`APP_ENV` is still `demo`** on the live site (confirmed via `/api/diagnostics`, 23 September
  2026) — the permanent "no real payment is taken" banner is still showing. Flipping to
  `production` needs a real (non-mock) payment provider configured first.
- **No 301 redirect map exists** for the three legacy domains (`ramhal.com`, `frramhal.com`,
  `enramhal.com`). Nothing in `next.config.ts` or the app handles this. Without it, any inbound
  search or link traffic to the old URLs 404s at cutover.
- **No transactional email provider is wired up.** Resend was the intended choice; no `resend`
  dependency or usage exists anywhere in the codebase. Order confirmations are not sent.
- **The site is still on `ramhal-theta.vercel.app`.** No custom domain is configured. Before
  `www.ramhal.com` (or equivalent) goes live: add the domain in Vercel, add it as an authorized
  redirect URI on the `ramhal-admin` OAuth client in the `machon-ramhal` Google Cloud project
  (confirmed not yet tested against a live domain), and update `SERVER_URL`.
- **Neon's project-wide network transfer allowance is exhausted for the month** (confirmed 23
  September 2026: `console.neon.tech` reports "Limit reached" for the project, and a direct `psql`
  connection to any branch — including `production` — is refused with "Your account or project has
  exceeded the quota"). This blocks every environment sharing the project, not just one branch.
  Needs either a plan upgrade or waiting for the monthly reset before any deploy, migration, or
  live verification against Neon can proceed.
- **Neon network transfer is shared by everything in the project, media included** (Neon docs,
  "Reduce network transfer costs" and "Neon plans": the allowance is "per project and shared across
  all products in that project, including Postgres, Object Storage, and Functions"; Object Storage
  "data transferred out counts toward your public network transfer allowance"). Free plan: 5 GB per
  project per month, compute suspended once exceeded. Every visitor download of a cover from the
  Neon bucket spends the same allowance as a database query. Decide before go-live whether the
  media bucket moves to Cloudflare R2 (already named in `.env.example` as the intended home for
  the larger archive) and whether the plan is upgraded.
- **Local checks should not touch Neon.** `next build` prerenders every book page against the live
  database, and AGENTS.md requires a build before every commit. Proposal, not yet built: restore
  the nightly `pg_dump` into a local PostgreSQL 18 and point local `DATABASE_URI` and
  `TEST_DATABASE_URI` at it; only Vercel builds reach Neon. See `docs/reports/TASK-44.md`.
- **Verify TASK-44 once Neon accepts connections again:** log the JSON byte size of
  `getCatalogueBooks(locale)` and of one `getCatalogueBookBySlug` result before and after, and
  count Payload queries during one `next build` before and after.

## Store & payments

- **Pay-by-phone / "call me back" does not exist as an order type.** The client uses this flow
  daily on the legacy site. Today `Orders` only carries a required contact `phone` field
  (`src/collections/Orders.ts`) — there is no order status or flag representing "customer wants to
  pay by phone; staff will call." Needs a real design, not a bolt-on field.
- **Donations record nothing.** `PAYPAL_DONATION_URL` (`src/lib/donation.ts`) is a plain outbound
  link to a hosted PayPal donation page. No donation ever creates a record in this database — no
  amount, no donor, no date. If the institute wants to track or acknowledge donations, this needs
  its own model.

## Admin & editable content

- **The homepage's masthead photo (`public/home/books-shelf-original.jpg`) is not in Media.** It's
  editorial content (a books-shelf photo), not brand furniture, so it doesn't belong in `public/`
  per `docs/DECISIONS.md` §16 — out of scope for the TASK-42 image migration, which covered only
  the three narrative pages and the donate photo.
- **Courses are curated in code**, including which "complete courses" are shown
  (`src/app/(frontend)/[locale]/courses/page.tsx`) — lesson IDs and completeness are hand-maintained,
  not editor-facing.
- **The press archive is curated in code** (redirects to `/rabbi-chriqui#press`). A Payload
  collection would let the son add a press link without a deploy.
- **The Q&A page is a prototype**, not a real feature: a small in-memory matcher over one sample
  entry (`src/lib/questionSearch.ts`), not backed by a collection. Needs: a localized collection
  (publication consent, anonymity, status, topic, stable slug, question, answer, cited works,
  publication date) and the Postgres Hebrew full-text search already chosen in
  `docs/DECISIONS.md` §4, replacing the prototype matcher. Add per-question canonical URLs and
  structured data once the collection exists.
- **Catalogue data gaps need a fresh count from the live admin dashboard.** The last count
  (69 missing-description, 34 absent-from-hebrew, 11 language-uncertain, 5 zero-price,
  4 price-mismatch, 93 books with no cover) predates the canonical-catalogue cleanup and the
  language/category rework (`docs/DECISIONS.md` §12/§13) and is stale. Re-run the count against
  today's ~62-book production catalogue before treating any of these numbers as current.

## Catalogue

- **Bilingual books (`he-fr`, `aramaic-fr`) match no language filter.** `Books.ts`'s
  `bookLanguage` select still offers `he-fr` and `aramaic-fr` as values, but the storefront's
  language filter is an exact match against `he`/`en`/`fr`, so a book carrying either value would
  appear under no language filter at all. No such book exists in the catalogue today, so this has
  not surfaced — but the option exists in the schema and will misbehave the day it's used.
- **Bibliographic metadata extraction covers one book.** The five structured fields on `Books`
  (creator credit, publication place, publisher, extent, endorsement credits) are populated for
  exactly one book (`מחול לצדיקים`, id 35). The rest of the ~62-book catalogue has not been
  reviewed for these fields — an editorial task, not a data guess.
- **On-demand revalidation on publish is not wired up.** Catalogue and book pages revalidate on a
  fixed schedule (`docs/DECISIONS.md` §5), not immediately when an editor publishes. An
  `afterChange` hook that triggers targeted revalidation is a real, scoped follow-up.
- **New genre categories (קבלה, מוסר, …) are the client's choice, not decided.** The model already
  supports adding categories and the storefront filter reappears with no code change once a second
  real category exists (`docs/DECISIONS.md` §13) — this is purely waiting on the client.

## Infra

- **`upsertBook`'s existing-`importKey` lookup has an unconfirmed bug.** Seen once, on a scratch
  branch: a candidate whose `importKey` matched an existing book exactly (verified via direct SQL
  equality) was not found by the lookup, triggering an attempted `create` that then failed on a
  slug collision. Not reproduced since, and the canonical-catalogue import (`docs/DECISIONS.md`
  §12) narrowed which candidates reach the importer at all — worth a focused look before
  `import:books` is trusted for a real from-scratch rebuild, since it has not been re-verified
  fixed or moot.
- **`next dev` (Turbopack) cannot render any admin page containing a Lexical `richText` field.**
  Reproduced repeatedly: the DOM is complete and correct, but nothing paints — a blank white
  screen. The same page renders correctly under `next build && next start`. Affects every
  collection with a description/body field (Books, Articles, Pages, Announcements, Events,
  Series). Not caused by, or fixed by, any change since it was found.
- **The backup reader credential (`ramhal-backups-app-reader`) is branch-wide `storage:read`**,
  not bucket-scoped — Neon's object-storage credentials scope to a branch, not to one bucket
  within it, and this is already the narrowest credential Neon's API offers. Recorded as a known
  limit, not a gap to close with this provider.
- **Preview deployments cannot authenticate at all.** Google's redirect URI is registered against
  the exact production origin; a preview URL is a different origin. Not worked around by design,
  but worth deciding whether preview deploys need their own OAuth client if they are to be used
  for review.
- **Re-verify the live catalogue pages after their ISR cache has actually expired**, or after the
  next deploy replaces it — ordinary follow-through on the language/category change in
  `docs/DECISIONS.md` §13, not a known defect.

## Client questions

- **Legacy articles and essays are deliberately not migrated** (`docs/DECISIONS.md` §14 — the
  French parsha essays and other long-form legacy content). This reverses the client's original
  request to migrate the full archive and needs their explicit confirmation before it is treated
  as final.
- **Whether English is built out properly or kept minimal is undecided.**
- **Whether the video/audio archive (YouTube index + self-hosted MP3s, `docs/DECISIONS.md` §6) is
  in scope for this phase or a later one is undecided.** Neither the sync job nor the audio archive
  is built.
- **The Israeli payment vendor, and whether instalments (תשלומים) are offered, is undecided.**
  PayPal is the only implementation today.
- **Real product data is still outstanding from the client**: confirmed prices, cover images and
  publication dates for books the legacy sites never listed with them, and any new genre
  categories beyond `siddurim-machzorim` (see Catalogue, above).

## Resolved while compiling this backlog (dropped, not carried forward)

- Duplicate-book merge exceptions from the old three-site import (superseded by
  `docs/DECISIONS.md` §12 — the importer now refuses any candidate without a Hebrew-domain source
  entry, so the old per-pair remaps are no longer reachable).
- "One database, not two" and "development gets its own branch" — done; three branches
  (`production`/`development`/`testing`) exist and are documented in `docs/DECISIONS.md` §5.
- Diagnostics endpoint exposing the full connection string — narrowed to an authenticated-only
  field months ago; confirmed still narrow by reading `src/app/(payload)/api/diagnostics/route.ts`.
- CD/DVD catalogue removal, language-as-category cleanup, canonical `www.ramhal.com` catalogue —
  all done and verified against the live site.
