# Ramhal — Approach & Decisions

> Companion to `PROJECT_CONTEXT.md`. That file holds **facts with no decisions**; this one holds
> the decisions and the reasoning behind them. Where a claim was verified empirically, it says so.
>
> Status: stack agreed (see §14). Not yet a build plan. Last updated 10 September 2026.

---

## 1. What the site is

Not a shop with a blog attached. The site represents **מכון רמח״ל**, the institute Rabbi Mordechai
Chriqui built, and the books are **פרי היצירה** — the fruit of his and the institute's work.

Three entities, and the relationship between them is the story:

- **רמח״ל** — the subject
- **הרב מרדכי שריקי** — the one who devoted his life to publishing him, and the institute's authority
- **מכון רמח״ל** — the instrument he built to do it

The client's word for what it should be is **כולל — comprehensive, broad**. Depth is a feature, not
clutter. A thin marketing site would misrepresent what this is.

**Design consequence:** a book page is not a SKU. It presents a *work* — which Ramhal text it
carries, from which sources, what the **כתר מרדכי** commentary adds, why the edition exists. The
purchase follows from understanding. This is close to the opposite of conventional e-commerce page
design, and it is deliberate.

---

## 2. Structure

**One site, not three.**

- Hebrew at the root (`/`), no prefix
- `/en` and `/fr` prefixed, and the scheme extends to further languages
- One catalogue, one content model
- Currency and shipping resolved **at checkout by destination**, not by cloning the site

The three existing sites were split by currency and shipping zone, not language — that is the
disease being cured. If the rebuild does not fix it at the root, it will regrow.

**RTL-first.** Hebrew is the default, so layout is written with logical properties (inline-start /
inline-end, not left / right) and the LTR languages fall out of it. Retrofitting RTL onto an LTR
design is where this goes wrong.

---

## 3. Who operates it

**The Rav does not touch technology at all.** He is not a user of the system.

**His son does all administration** — content, recordings, books, orders.

So there is exactly one admin persona to design for. No simplified "rabbi mode," no second set of
screens. Two consequences worth building for anyway:

- **Roles, not a single account.** The Rav may want to publish a message and nothing else; a second
  editor should be addable without rebuilding anything.
- **Bus factor.** One person doing everything is a single point of failure.

---

## 4. Build philosophy

**Adopt the generic. Build the specific.**

| Adopt | Build |
|---|---|
| Admin panel, authentication, roles | The entire public site — no theme, no constraints |
| Media library, uploads, versioning, drafts | Shipping rules engine |
| Localisation machinery | Payment adapters |
| API layer | Archive index over video and audio |
| Store primitives — products, variants, carts, orders, transactions, addresses | Migration out of the old platform |

The reasoning: an admin panel is auth, CRUD screens, a rich-text editor, a media library, drafts and
versions, a localisation UI, search and pagination, and an RTL layout. That is most of a year's work
and **not one line of it is about Ramhal.** Meanwhile the trilingual content model, the shipping
rules, the archive index and the way a book page presents a work are things nobody else can supply.

Roughly a quarter custom, three quarters adopted — and the quarter is entirely the part that is
about this institute.

**A caution about AI-assisted development.** Generating code is cheap now; *owning* it is not. Every
line still has to be debugged, understood by whoever comes next, and carried through years of
dependency updates. Speed of writing was never the constraint. Surface area is.

---

## 5. Stack

**Next.js + Payload + PostgreSQL, as a single application.**

Chosen because:

- **Multilingual is the core problem**, and Payload's localisation is field-level and native — one
  product with three language values, not three copies
- The **Hebrew admin ships built in** — verified: `he.js`, ~37KB of real translations, one of 44
  languages in 3.88.0. The ecommerce plugin ships Hebrew too
- **Nothing recurring can lapse.** No licences, no subscriptions that degrade the site when unpaid
- **The data stays in your own Postgres tables.** If Payload vanished, you lose an admin UI and keep
  everything that matters

**Rejected, and why:**

- **Shopify** — the storefront, checkout and platform terms are not yours and can change. Fails the
  freedom test outright
- **WordPress + WooCommerce** — genuinely strong on order management, shipping screens and existing
  Israeli gateway plugins, and any Israeli developer can take it over. Rejected because multilingual
  is the core problem and WooCommerce handles it worst: WPML plus a multi-currency layer is roughly
  $200/year recurring against a ~₪1,850/year total budget, and it is the most breakage-prone corner
  of that ecosystem. Rented functionality on a site with no maintainer is a predictable failure mode

**Compatibility, verified:** `@payloadcms/next` declares `next: >=16.2.6 <17.0.0`. The existing
Next.js 16.3.4 scaffold in this repo is supported.

### What Payload does *not* give you — verified by inspecting the package

Installed `@payloadcms/plugin-ecommerce@3.88.0` and read it directly:

- **Payment adapters shipped: Stripe, and only Stripe.** The sole export is `./payments/stripe`.
  PayPal and any Israeli gateway are both written from scratch
- **No shipping cost engine of any kind.** "shipping" appears in the types only as
  `shippingAddress` — an address field. No shipping methods, no rate calculation, no admin UI
- **No tax logic at all.** Zero matches across the package
- Collections created: `addresses`, `carts`, `orders`, `products`, `transactions`, `variants`
- **Multi-currency is native** (`CurrenciesConfig` / `supportedCurrencies`) — which matters, since
  that is the thing that broke the old setup
- `PaymentAdapter` is a documented interface (`initiatePayment`, `confirmOrder`, webhook endpoints),
  so writing an adapter is structured extension work, not fighting the framework

**This is the honest cost of the choice.** The shipping engine and the payment adapters are yours to
build and maintain. Keep them small, boring and well documented — that is the bill for freedom.

---

## 6. Rendering & hosting

**Content static, shop dynamic.** Articles, essays, biography and the media index are generated
ahead of time and served from cache, rebuilt on publish. Cart, checkout, orders and admin are
dynamic. The reading half of the site then stays fast and available even when the database is
struggling.

**Do not target $0/month.** They already pay ~₪113/month plus ~₪500/year for MP3 hosting — about
₪1,850/year all in. The constraint was never *free*; it was *no recurring licences, roughly
cost-neutral, survives without a maintainer.*

Chasing free tiers buys real fragility for money that is already budgeted: databases that pause on
inactivity, function timeouts, no support, and terms that change — the same lock-in argument, applied
to hosting. A small paid host and a paid Postgres, on the order of $10–15/month, is materially more
reliable and still roughly **half** what they spend today.

**Two verified sharp edges if a serverless free tier is used anyway:**

- **Netlify's free-plan function timeout is 10 seconds.** Bulk imports, image derivative generation
  and large uploads do not reliably fit. The migration would run straight into it
- **Supabase's Supavisor pooler does not support prepared statements in transaction mode** (their
  own docs). Payload's Postgres adapter runs on Drizzle, which uses prepared statements by default.
  Fixable with a flag, but it presents as "worked in dev, fails in production"

---

## 7. Media

**Videos stay on YouTube.** Never rehosted. A scheduled job syncs channel metadata — id, title,
playlist, date, language — into the database, and the site renders an index over it. YouTube keeps
paying for the hosting; the institute owns the navigation.

This matters because the archive is ~1,897 videos, Hebrew and French mixed on one channel with **no
language tagging**, uploading at near-daily cadence. The raw channel is unusable as navigation. A
faceted index — language × series × text — is the single largest value the new site can add.

**MP3s are self-hosted.** Required: a real segment of listeners will not use YouTube. Object storage
with zero egress fees makes this cost roughly a dollar a month rather than a bandwidth problem — and
it *saves* against the ~₪500/year currently paid to a third-party host.

**Open design question:** are the MP3s the same shiurim as the videos? The overlap looks heavy
(אדיר במרום exists on YouTube *and* as 259 MP3 lessons on zohar-israel.com). If they are the same,
this is **one archive with two renditions** and the audio should be derived from the video
automatically — not two libraries somebody has to maintain in parallel, because they won't.

**The audio section should be the plainest thing on the site.** Its audience is on filtered
connections, kosher phones, older browsers and limited data. Works without modern JavaScript, large
obvious play and **download** controls, small pages, no video embeds nearby.

**A podcast feed is ten lines away** once the audio has titles and dates in a database. There is
currently no podcast distribution of any kind.

---

## 8. Store

**Preserve what works.** The order dashboard, the payment-received status and the phone-contact flag
are used daily and their absence would be felt.

**Payments behind one interface.** Start a payment, confirm it, mark the order paid. PayPal is the
first implementation because it already works. The Israeli gateway becomes a second implementation
whenever it is named — not a rewrite. Pay-by-phone is the same shape: order created, payment
pending, staff will call.

**Use the gateway's hosted payment page.** Card details never touch our own site. For an operation
with no technical staff and no security budget, this is the difference between a manageable risk and
a liability nobody is watching.

**Shipping:** zones (Israel / Europe / rest of world), tiered by item count, free above ten books,
free self-pickup. Note that free-shipping-over-ten-books implies **institutional and bulk buyers** —
synagogues, schools, kollels ordering sets. That may deserve its own path on the site, not just a
discount.

**Still to settle:** how versatile the rules must be. "Set by the developer, adjusted rarely" and
"the son invents new rules in an admin screen" are very different amounts of work.

---

## 9. Homepage

Three things the client asked for: announcements, upcoming lectures, new books.

**Anything dated expires itself.** A "coming soon" lecture still sitting there four months later is
the commonest way an institute site announces that nobody is home. Automatic expiry does more for
how alive the site feels than any amount of design.

**New books are not a section to curate.** Give products a publication date and let the homepage show
the newest automatically. Every field someone must remember to clear is a field that will rot.

**Recurring schedule and one-off events are different types.** The daily/weekly shiur times and
prayer times are stable and currently hardcoded into every page's sidebar. A hilula or a seminar is
dated and temporary. They look alike on the page and are nothing alike in the admin; modelling them
as one thing is a mistake that surfaces six months later.

---

## 10. The freedom principle

Set by the client, and it governs the decisions above: **not to be Wix-bound to any vendor.** They
are living inside exactly that mistake — twenty years of content trapped in a builder with no export.

Applied precisely, there are two kinds of lock-in and only one is the trap:

- **Data lock-in is the trap.** Content, catalogue, URLs — the things you cannot get back
- **A payment gateway holds almost none of your data.** It takes a card and reports success. Orders,
  customers and products stay in your database. Switching means writing an adapter, not migrating

So the vendor's identity affects *how much work*, not *how trapped*. It is not a blocker.

**The second freedom, easily missed:** freedom from *us*. Custom code only its author understands is
its own lock-in. Pay that risk down deliberately — small and boring over clever, obvious patterns,
and a repo documented well enough that a stranger or an AI agent can service it without the original
author.

---

## 11. Deliberately not decided

- Visual design direction — waiting on brand assets, logo and printed book design
- Whether English is built properly or reduced to a minimal presence
- Whether the archive front door is in scope for v1 or a later phase
- The Israeli payment vendor, and whether instalments (תשלומים) are offered
- Exact hosting provider

---

## 12. Gaps any build plan must cover

Missing from the plan reviewed on 9 September, and each is real work:

1. **Migration.** 164 product listings, 35 French essays, 49 content pages, out of a builder with
   **no export**, where hyphens are `%2D`-encoded so ordinary crawlers 404, where Noa'h lives at
   `/NOUVEAU.html`, and where a holiday's article and video differ only by a `-1` suffix that is
   reversed for one of them. Plausibly a third of the project. It was absent from the table, the
   costs and the validation step
2. **Transactional email** — order confirmations need a provider, and it is not free indefinitely
3. **301 redirect map** — three domains of existing URLs are being retired. Without redirects,
   whatever search presence exists is discarded, including inbound traffic from Torah-Box
4. **Hebrew full-text search** — Postgres ships **no Hebrew text search configuration**. An archive
   of ~1,900 recordings plus ~90,000 words needs search, and Hebrew stemming is not free
5. **Backups** — named as a principle, not as a configured mechanism

**One thing that plan got right and should be kept:** validate the Hebrew admin and one complete
sandbox purchase with the real payment provider *before* committing to the full build.

---

## 13. Build order

Not the order people expect, and the order matters.

1. **Content model** — in Payload it is code, and everything derives from it
2. **Migration** — until real content is in the database you are designing against imaginary data,
   and this content is messy in ways that will change the model
3. **Frontend**
4. **Store**
5. **Media sync**

Building the homepage first is how projects discover in month three that the content model cannot
express what the content actually is. With 44 parsha pages of inconsistent titles and three
catalogues that have drifted apart, that risk here is not hypothetical.

---

## 14. Final stack (agreed 10 September 2026)

### Core

| Layer | Choice | Note |
|---|---|---|
| Framework | **Next.js 16.3.4** | Already scaffolded. `@payloadcms/next` declares `next: >=16.2.6 <17.0.0` — verified compatible |
| Language | **TypeScript** | |
| Styling | **Tailwind 4 + shadcn/ui** | Already in the repo |
| CMS & admin | **Payload 3.88**, embedded in the Next app | One repo, one deploy. Hebrew admin ships built in |
| Store | **Payload ecommerce plugin**, extended | Shipping engine and payment adapters are ours to build — see §5 |
| Database | **PostgreSQL** | |

### Infrastructure

| Concern | Choice | Reasoning |
|---|---|---|
| Hosting | **Railway** (Render an equally fine substitute) | App + managed Postgres in one place, no server administration, no serverless function timeouts or connection-pooler traps. ~$10–20/month |
| Object storage | **Cloudflare R2** | Zero egress fees. The MP3 archive costs ~$1/month rather than being a bandwidth problem — and replaces the ~₪500/year third-party host |
| Video | **YouTube**, metadata synced via the YouTube Data API | Never rehosted. We own the index; they pay for delivery |
| Email | **Resend** | Order confirmations. Was missing from every earlier plan |
| Search | **Postgres full-text with a custom Hebrew configuration**, plus `pg_trgm` | Postgres ships no Hebrew config; we build one (niqqud stripping, gershayim, the ו/ב/כ/ל/ה/ש/מ prefix letters). At ~2,000 records this is sufficient and adds no service. Escape hatch: Meilisearch |
| Payments | **Adapter interface** — PayPal first, Israeli gateway second | Hosted payment page only. Card details never reach our site |
| Errors | **Sentry**, free tier | |
| Backups | Managed Postgres backups **plus** a scheduled dump to R2 | Two mechanisms — one is not a backup |

**Total running cost: roughly $15–25/month** — at or below the ~₪113/month currently paid, with nothing
recurring that can lapse and silently degrade the site.

### Explicitly rejected, and the honest cost of rejecting them

- **Astro** — the better frontend for a library-shaped site (near-zero JS for a page of text, islands
  only where needed). Rejected because Payload does not embed in it, and one fewer moving part wins
  on a project with no maintainer.
- **Medusa** — solves Payload's shipping/tax/regions gap properly, open source and self-hostable.
  Rejected because two services is one too many here. **Revisit if a maintenance budget ever exists.**
- **Shopify** — storefront, checkout and platform terms are not ours. Fails the freedom test.
- **WordPress + WooCommerce** — see §5.
- **Supabase, Netlify free tier, and any $0/month target** — see §6.

The first two are genuine sacrifices made for operability, not because the alternatives are worse.

### Hard gate before any feature code

Stand up Payload with the Hebrew admin and push **exactly one sandbox purchase through the real
payment provider, end to end.** If the Hebrew admin is unpleasant for the son, or the gateway fights
us, that must surface in week one — not month three.

Then proceed in the order given in §13: content model → migration → frontend → store → media sync.

---

## 15. A real cost of the Payload choice: its CLI is fragile against Next 16

Recorded during Task 01. **Payload's CLI tooling (`migrate:create`, `migrate`, `generate:types`) does
not currently work in this project**, on either Node 22.23.2 (the pinned LTS) or Node 24.12.0, with
every version pin the upstream issue tracker suggests applied. This is not a wait for someone else to
fix something unrelated — it is a live gap in the stack this project is built on, and it cost real
time to isolate. Recording it plainly rather than papering over it:

**Two independent, verified root causes**, both confirmed with direct reproduction (not inferred from
searching for the error text):

1. `@payloadcms/richtext-lexical` depends on `lexical`, whose `*.node.mjs` entry files each do a
   top-level `await import(...)` to pick a dev or prod build. Node refuses to `require()` any ESM
   graph containing top-level await, and Payload's CLI loads the TypeScript config via a code path
   that ends in `require()` — confirmed precisely with
   `node --experimental-print-required-tla`, which names the exact files.
2. `@payloadcms/db-postgres` imports `loadEnv` from `payload/node`, which does
   `import nextEnvImport from '@next/env'` — a plain CommonJS package. That resolves correctly under
   Next's own bundler and resolves to `undefined` under tsx's CJS/ESM interop, crashing on
   `const { loadEnvConfig } = nextEnvImport`.

Neither is the tsx-version bug named in payloadcms/payload#16949 (fixed by pinning tsx to 4.21.0 —
done, and worth keeping regardless) nor purely the import-resolution bug in #16684 (fixed by using
relative, `.ts`-extensioned imports in the config graph — also done, also worth keeping). Both fixes
are real and are applied. Neither touches the two causes above.

**The workaround**: `src/app/(payload)/api/dev-migrate/route.ts` calls the exact same
`payload.db.createMigration()` / `payload.db.migrate()` methods the CLI calls, from inside a Next.js
route handler — a process Next's own bundler builds correctly, sidestepping both bugs entirely.
`scripts/dev-migrate.mjs` drives it: starts `next dev` with `PAYLOAD_MIGRATING=true` (Payload's own
flag to skip the dev-mode schema push, which otherwise marks the database as dev-pushed and makes
`migrate()` block on an interactive confirmation no route handler can ever answer), waits for the
route to respond, calls it, shuts the server down. `npm run migrate:create` / `npm run migrate` use
it. It also fixes a third, smaller issue the workaround itself exposed: Payload's generated migration
template imports `MigrateUpArgs`/`MigrateDownArgs` as values when they are type-only exports —
harmless under every bundler, which silently elide unused type imports, but a hard failure under the
loader `payload.db.migrate()` uses here. The fix-up is a one-line, idempotent string replace on the
freshly written file, not a forked template.

**Verified, not assumed**: generated a real migration and read it (615 lines, the full schema — not
an empty stub); applied it to a genuinely empty Neon database and confirmed the resulting schema —
every table, every column and type — matches what `next dev`'s auto-push builds; confirmed the seed
(`src/seed.ts`) runs clean against that freshly migrated database.

**Delete `src/app/(payload)/api/dev-migrate/route.ts` and `scripts/dev-migrate.mjs`, and revert
`migrate`/`migrate:create` in `package.json` to call `payload migrate` / `payload migrate:create`
directly, once either root cause is fixed upstream** — check by running `payload migrate:create`
directly; if it no longer throws `ERR_REQUIRE_ASYNC_MODULE`, the first cause is fixed, and the route's
own doc comment names the second to check next.

This is a genuine cost of choosing Payload, not a one-off surprise: a project with **no maintenance
retainer** (see §7) will hit this exact class of problem again on some future Payload/Next/Node
version bump, with nobody watching for it. The mitigation — routing schema tooling through Next's own
bundler instead of Payload's CLI — is small and documented, but it is a workaround, and it should stay
visible as one rather than being smoothed over into "migrations just work here."

---

## 16. Third architectural opinion — arbitration (18 September 2026)

A third model gave an independent architectural opinion, working only from a verbal brief and
without seeing this codebase. Recorded because the convergence is evidence, and the one
disagreement needed resolving.

### Convergence — three independent models, same stack

Next.js + TypeScript · Tailwind + shadcn/ui · Payload · PostgreSQL · Next and Payload in one
application and repository · hosted checkout through the institute's own provider · guest checkout
first.

It reached §5's conclusion independently and by the same reasoning: "I disagree that 30 books is too
few to justify a CMS — the editorial workflow matters more than the number of records." Its commerce
warnings also match what §5 records from reading the package directly: no native shipping or tax, and
Stripe as the only shipped payment adapter.

### Rejected: Supabase in place of Neon

Proposed because Supabase supplies database, auth and file storage from one provider, which becomes
attractive if staff sign in with Google. Rejected on three grounds:

1. **Verified technical friction.** Supavisor does not support prepared statements in transaction
   mode (Supabase's own docs), and Payload's Drizzle adapter uses them. Survivable with a flag, but a
   sharp edge chosen deliberately. See §6.
2. **The integration cost is named in the opinion and not weighed.** "Supabase authentication and
   Payload authentication do not connect automatically" — meaning a custom auth strategy bridging two
   systems, written and maintained, **for one or two users.** Payload's own auth covers that. The
   opinion's own caveat, that Supabase Auth suits a *fully custom* admin, does not apply here.
3. **Neon already works**, with migrations verified end to end. No problem to solve.

### Open: is Google sign-in actually a requirement?

Raised with that model but never with this project. If staff genuinely require Google sign-in, it is
the one place the Supabase argument has force and the auth design should be revisited. If it meant
"an easy login," Payload's built-in auth already provides it. **Unresolved — ask the client.**

### Absorbed: commerce requirements for the checkout task

Adopted as requirements for TASK-07:

- server-side calculation of prices and totals — never trust a client-supplied amount
- verified payment notifications, and idempotent handling of repeated ones
- **orders preserve the price actually paid, as a snapshot — never a reference to the book's current
  price.** Changing a price next year must not change last year's orders. Not previously specified;
  a defect waiting to happen, and it came from this review
- payment status and fulfilment status kept separate — matching their real workflow, where "PayPal
  received" and "posted" are different facts
- explicit handling of failed and cancelled payments
- guest checkout, unless customer accounts earn their place

### Weighting

The opinion worked from a thinner brief than reality — it describes "more than 30 books"; the
catalogue is 128. Its conclusions still hold, but it had not seen the audit, the reconciliation, or
the verified package behaviour.

---

## 17. Work happens on main (19 September 2026)

Task branches are dropped. Every task commits directly to `main`, and `main` is pushed to
`origin` at the end of it. Recorded in `AGENTS.md` under the workflow protocol, which is the
binding version; this section is the reasoning.

**Why.** The branches were not buying review. Nothing was ever reviewed *on* a branch — each
one was merged the moment its task reported done, and TASK-07's was fast-forwarded, so it left
no trace in the history that a branch had existed at all. What they bought instead was a way to
forget: TASK-05's branch sat merged-but-undeleted, TASK-06's sat unmerged for two days while
nine commits went unpushed, and the review trail for twelve accepted defects sat uncommitted in
a working tree on one laptop. A single line of work removes that whole class of mistake.

**What replaces the safety net.** A branch was, in practice, a place a broken state could live
without consequence. On `main` there is no such place, so two rules take its weight and are
recorded in `AGENTS.md` as requirements rather than habits:

1. Nothing is committed that does not pass `tsc --noEmit`, `eslint`, `vitest` and `next build`.
   Verification happens before the commit, not after the task.
2. A task that turns out wrong is reverted across its commit range. No force-push, no rewritten
   history — `origin/main` may already have it, and on a handover-first project the history is
   part of the deliverable.

**What this does not change.** Commits stay small, single-purpose and conventional — that
discipline matters more without branches, not less, because `git revert` over a task's range is
only clean if the range is clean. Review still happens the same way it already did: after the
work exists, against the running thing, with findings going to `docs/reviews/` and a verdict
deciding what is acted on.
