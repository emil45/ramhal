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

**The demonstration may start on free allowances; the live shop must not depend on them.** They already
pay ~₪113/month plus ~₪500/year for MP3 hosting — about ₪1,850/year all in. The durable constraint is
*no recurring licences that degrade the product when unpaid, roughly cost-neutral, survives without a
maintainer*, not that a pre-launch demonstration must incur hosting cost. The Vercel demo therefore uses
Hobby with mock payments and moves to Pro before real commerce begins. Neon supplies both Postgres and the
small demo media bucket; the generic S3 adapter can move media to R2 without changing the content model.

Free tiers still bring real fragility: databases may pause on inactivity, function limits are lower,
support is absent, and terms change. Imports, migrations, backups and bulk media processing therefore do
not run as public application requests, even during the free demonstration.

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
| Hosting | **Vercel** — Hobby for the temporary demo, Pro before the live shop | Native Next.js deployment and preview workflow. Payload runs in Node functions; migrations run before the build, long imports stay local, and function/database regions are colocated. Pro is $20/month before excess usage |
| Database | **Neon Postgres** | External to the application host. Runtime traffic uses the pooled connection string; committed migrations remain portable PostgreSQL |
| Object storage | **Neon Object Storage for the demo; Cloudflare R2 before the full media archive** | The demo bucket is included with the existing Neon project and is S3-compatible. R2 remains the intended larger-scale store because zero egress fees make the MP3 archive cost about $1/month rather than becoming a bandwidth problem |
| Video | **YouTube**, metadata synced via the YouTube Data API | Never rehosted. We own the index; they pay for delivery |
| Email | **Resend** | Order confirmations. Was missing from every earlier plan |
| Search | **Postgres full-text with a custom Hebrew configuration**, plus `pg_trgm` | Postgres ships no Hebrew config; we build one (niqqud stripping, gershayim, the ו/ב/כ/ל/ה/ש/מ prefix letters). At ~2,000 records this is sufficient and adds no service. Escape hatch: Meilisearch |
| Payments | **Adapter interface** — PayPal first, Israeli gateway second | Hosted payment page only. Card details never reach our site |
| Errors | **Sentry**, free tier | |
| Backups | Managed Postgres backups **plus** a scheduled dump to R2 | Two mechanisms — one is not a backup |

**Demo running cost: initially the free allowances of Vercel Hobby and Neon. Live-shop base cost:
Vercel Pro at $20/month, plus whatever paid Neon/R2/Resend usage the real traffic requires.** Hobby is
temporary and no real payments run there; the deployed code and data services do not change at upgrade.

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

**The workaround**: migration creation and application are separate. For creation,
`src/app/(payload)/api/dev-migrate/route.ts` calls `payload.db.createMigration()` from inside a Next.js
development process, whose bundler sidesteps both CLI bugs; `scripts/dev-migrate.mjs` starts that process,
calls the authenticated development-only route, and shuts it down. For application,
`scripts/migrate.mjs` loads the self-contained migration files into a minimal Payload/Postgres config,
without loading the application config at all. `npm run migrate:create` and `npm run db:migrate` expose
the two paths. `push: false` makes committed migrations the only schema writer, so Payload never creates
the batch `-1` development marker that used to block unattended migrations. The creation route also fixes
a third, smaller issue the workaround exposed: Payload's generated migration
template imports `MigrateUpArgs`/`MigrateDownArgs` as values when they are type-only exports —
harmless under every bundler, which silently elide unused type imports, but a hard failure under the
loader `payload.db.migrate()` uses here. The fix-up is a one-line, idempotent string replace on the
freshly written file, not a forked template.

Seeding follows the same principle but never runs from an application lifecycle hook: Vercel may initialise
many function instances. `scripts/seed.mjs` builds a minimal config containing only the collection and
globals the seed touches, and `npm run seed` is an explicit, repeatable operation.

**Verified, not assumed**: generated a real migration and read it (615 lines, the full schema — not
an empty stub); applied it to a genuinely empty Neon database and confirmed the resulting schema —
every table, every column and type — matches what `next dev`'s auto-push builds; confirmed the seed
(`src/seed.ts`) runs clean against that freshly migrated database.

**Delete `src/app/(payload)/api/dev-migrate/route.ts` and `scripts/dev-migrate.mjs`, and revert
`db:migrate`/`migrate:create` in `package.json` to call `payload migrate` / `payload migrate:create`
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

## 18. APP_ENV, and what the storefront sells (20 September 2026)

**`APP_ENV`, not `NODE_ENV`.** TASK-09 gated the mock payment provider on `NODE_ENV`, which
means "optimised build", not "the live shop": a deployed demo is `NODE_ENV=production` and could
not start. `APP_ENV` (`development` | `demo` | `production`) names the deployment. The mock is
allowed in the first two and refused — `exit(1)`, same message — in `production`. It is required
with no default, because a default of `development` would let a forgotten variable in a real
deployment switch the mock on. It is deliberately an environment name and not an override flag:
a flag is something set by accident; a name is something a person has to mean.

`demo` also carries a permanent, undismissable banner on every page. `APP_ENV` is read while
pages are prerendered, so it must be set for `next build` as well as `next start`. Building in one
environment and running in another would bake the wrong banner state into the HTML, so the build
records its `APP_ENV` (`next.config.ts`) and the server exits at startup if it differs.

**CDs and DVDs are gone from the catalogue.** The institute no longer sells recordings online.
The `cd-dvd` category and 28 books (10 filed under it, 18 more identifiable by "CD", "DVD", "MP3"
in the title) were deleted from the database, the category is no longer seeded, and the importer
skips both (`DISCONTINUED_CATEGORY_SLUGS`, `isRecordedMediaTitle`) so a re-import cannot bring
them back. Orders keep their own snapshot of what was sold, so past orders are unaffected.

## 19. Google sign-in for the admin panel (22 September 2026)

§16 left this open: "if staff genuinely require Google sign-in... the auth design should be
revisited." They do — the son should never have to remember a password.

**Rejected: Payload's enterprise SSO product.** Negotiated pricing, and a licence that can lapse
is exactly what §5/§10 rule out — nothing recurring, nothing that degrades the product when
unpaid.

**Accepted: `payload-oauth2`** (WilsonLe, MIT), via `auth.strategies` — a first-party extension
socket on the collection (`node_modules/payload/dist/auth/types.d.ts`), the same shape as the
`PaymentAdapter` interface already accepted in §5. Pinned to an exact version
(`"payload-oauth2": "1.0.21"`, no caret) in `package.json`: it is a single-maintainer auth
package, and an upgrade to it is a diff to read, not a number to bump. `jose` is added as a
direct dependency for the same reason — the plugin imports it while declaring no runtime
dependency of its own, living off Payload's transitive copy today; that breaks silently the day
Payload's own dependency moves.

**Four defences, and what each one defends against:**

1. **`onUserNotFoundBehavior: 'error'`**, not the plugin's default `'create'`. The default would
   create a user row — with `Users.role` defaulting to `'editor'` — for *any* Google account that
   completed the flow. This is the difference between "an allowlist" and "an invite link."
2. **`allowOnlyListedAdmins`, a `beforeLogin` hook, the only gate.** It throws Payload's
   `Forbidden` unless the authenticating email is in `ADMIN_ALLOWED_EMAILS`. Verified by reading
   Payload's own login operation and the plugin's callback endpoint: both run the collection's
   `beforeLogin` hook array before issuing a session, so one hook covers password login, the
   Google callback, and REST `/api/users/login` alike. It does not live in the login UI or in
   plugin options, because `/api/users/oauth/authorize` is a URL anyone can type regardless of
   what the UI shows.
3. **`email_verified` checked, and only `email` extracted** (`getGoogleUserInfo` /
   `parseGoogleUserInfo` in `src/lib/auth/googleSignIn.ts`). The plugin writes its `getUserInfo`
   return value straight onto the user document via `payload.update({ data: userInfo })` — so
   `role` must never be in the blast radius of a third party's JSON, and an email Google itself
   has not verified must never be trusted as an identity.
4. **`useAPIKey` stays off** on `Users`. A third door is not a defence in depth, it is a second
   thing to secure.

**The local strategy was retained at first, then removed the same day.** The original plan kept
`disableLocalStrategy` unset, reasoning that email+password should stay as Emanuel's break-glass
path if Google, this Google Cloud project, or the son's Google account were ever unavailable. That
plan met reality once: `create-first-user` only ever shows itself while a collection has zero
users, and that was briefly, unavoidably true of the freshly-deployed production database — the
Google callback's `onUserNotFoundBehavior: 'error'` cannot bootstrap the first account, only a
person completing that screen can. Emanuel did, closing the window, but the account created to
close it had a real password sitting in the database. Emanuel's
instruction on seeing it was direct — remove the password path entirely, not just this one
password. `Users.auth` is now `{ disableLocalStrategy: { enableFields: true } }`: `enableFields`
keeps the password columns in the schema (no migration to drop them; nothing can use them for
login) rather than forcing an immediate destructive column drop in the same change.

**The real cost of that reversal, verified by reading `@payloadcms/next`'s own admin root view**
(`views/Root/index.js`): the redirect to `create-first-user` when the collection is empty is
itself gated on `!disableLocalStrategy`. With it set, an empty `users` table does not fall back to
create-first-user — it just shows a login screen with a Google button and nobody to match against
(`onUserNotFoundBehavior: 'error'` refuses to invent one). If the table is ever fully emptied,
there is no self-service way back into the admin UI at all; recovery means either a direct
database insert or temporarily re-enabling the local strategy in code and redeploying. This is a
real trade against convenience, made with full knowledge of the cost, not an oversight.

**This amends §3.** A second editor is no longer addable from the admin UI alone — Users' `create`
access already required an existing admin, but a *login-capable* admin now also takes an
environment change (`ADMIN_ALLOWED_EMAILS`) plus a redeploy, not just a form. The trade: the
allowlist is the one thing that must stay correct for anyone — including Emanuel — to get in at
all, and an attacker holding a session cannot edit it from inside the admin UI, because it is not
in the admin UI. If `ADMIN_ALLOWED_EMAILS` is ever wiped in Vercel, nobody can log in, including
Emanuel — that is the correct failure direction (closed, not open), and it is written down here so
whoever finds a locked-out deployment knows where to look.

**A real, verified cost, not assumed:** `payload-oauth2` adds a `sub` text/indexed field to the
Users collection unconditionally whenever it is enabled, regardless of `useEmailAsIdentity`
(`modify-auth-collection.js` — there is no plugin option to suppress it). With this repo's
`push: false` (§1/TASK-01: schema comes from committed migrations only, in every environment),
that is a real migration, not a config-only change — confirmed by generating one
(`20260922_062811_google_sign_in.ts`: one additive column, one index) and applying it. The field
is never read, since `useEmailAsIdentity: true` looks users up by email, but it exists in the
schema regardless.

**Also verified, and worth recording plainly:** the package's compiled output re-exports sibling
modules without a `.js` extension (`payload-oauth2/dist/index.js`), which Node's native ESM
resolver refuses. This is the exact class of bug §15 documents for Payload's own CLI — Next's
bundler tolerates it, raw Node does not. It surfaced in this repo's Vitest integration tests
(which boot the real Payload config under Node), fixed by telling Vite to inline and resolve the
package itself instead of externalising it to Node (`vitest.config.ts`, `test.server.deps.inline`).
`next dev` and `next build`, which go through Turbopack/webpack, were never affected.

**Google sign-in does not work on Vercel preview deployments.** The redirect URI is registered
against the exact production URL in the Google Cloud console; a preview URL is a different
origin. This is not worked around. **Correction, TASK-24:** this paragraph originally went on to
say previews and local development without a configured Google client fall back to local
password login. That stopped being true the same day it was written, and §20 makes it
unconditionally false — there is no local password login left to fall back to. A preview
deployment simply cannot authenticate at all right now, which is a real, currently-unaddressed
gap, not a designed fallback.

---

## 20. TASK-24: one production database, and Google sign-in becomes unconditional (22 September 2026)

Three related tightenings, all decided together while closing out TASK-20's loose ends.

### Google sign-in is now required, not optional

§19's `readGoogleSignInConfig` originally returned `null` when both variables were unset, so the
plugin would quietly disable itself and local password login would carry a deployment with no
Google Cloud client — meant as the story for local development. That story stopped being true the
moment `disableLocalStrategy` became unconditional (§19, same day): an unconfigured deployment
now has *no* way into `/admin` at all, Google or otherwise, and the old comment describing the
"or neither" branch as a working local-dev path was actively misleading. `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` are now required in every environment, checked at boot
(`exitUnlessGoogleSignInIsSafe`, the same pattern as `exitUnlessAdminAllowlistIsSafe`) rather than
documented as optional. `disableLocalStrategy` is not made conditional on `APP_ENV` to compensate
— that would be exactly the environment-conditional-authentication divergence §18 exists to
prevent, trading one bad story (local dev quietly has no login) for a worse one (local dev quietly
has a *different, weaker* login than production).

### One database, not two — the demo project is gone

TASK-20/22/23 all treated the Neon project named "Ramhal" (`lucky-field-60207292`) as production,
verifying and repairing catalogue data on it directly through the Neon MCP tools. It never was:
the actual `DATABASE_URI` wired into Vercel's Production environment pointed at a *different*
Neon project, "ramhal-demo" (`dawn-sun-46089061`, created 20 September during the APP_ENV/demo
work in §18), sitting at exactly the pre-repair state — 100 books, 11 uncategorized, zero in
siddurim-machzorim. Three tasks' worth of "verified against production" checks were actually
checking a database the live site never served. Found while provisioning the son's admin account
for TASK-24
(item 1): creating his `users` row through the real `/admin` UI landed nowhere near where the
Neon MCP tools showed a `users` table — full detail in `docs/reports/TASK-24.md`.

Resolved by decision, not accident: **`lucky-field-60207292` is now the only database**, in every
environment — local development, testing/debugging, and the live site all point at it
(`DATABASE_URI` in `.env` locally, and in Vercel's Production environment, are the same
database). "ramhal-demo" and its Neon Object Storage bucket are deleted. Before deleting it, the
11 real uploaded book covers were migrated forward by re-running `npm run import:prepared-covers`
against the surviving database — its source of truth is the checked-in `assets/book-covers/`
directory, not the old bucket, so this was a fresh, verified re-upload, not a copy of bytes
between buckets.

**The real cost, stated plainly:** integration tests that hit the real database
(`*.integration.test.ts`) now write to and clean up from the one production database that also
serves the live site, on every local test run. This was observed happening in real time while
this task was in progress — a concurrent local test run left two `ספר בדיקה` (test book) fixture
rows sitting in production for the seconds between their creation and that test's own teardown.
The teardown ran and they were gone before anyone but a person watching the database at that exact
moment would ever see them, which is the only reason this is a note and not an incident. There is
no staging database standing between "a developer's laptop" and "what the public sees." This is a
deliberate trade — see `docs/reports/TASK-24.md` for the instruction that made it — not an
oversight, and it should be revisited before the site has real customers, not after.

### One of TASK-22's four duplicate merges is not encoded

TASK-22 merged four pairs of duplicate books by hand. Three are now encoded as data
(`REVIEWED_DUPLICATE_IMPORT_KEY` in `src/importBooks.ts`), the same way TASK-23's
`REVIEWED_LANGUAGE`/`REVIEWED_CATEGORY_SLUG` overrides already are, so a from-scratch import
reproduces the merge instead of recreating the
duplicate. The fourth — two listings for "זוהר רשב״י ח״ב", differing only in whether the title
has commas — is not, and reproducing it would take more than a map entry: the survivor
(`זוהר רשב״י ח"ב - פרשת נח, לך לך, וירא, ...`, with commas) is a `singleton`-bucket candidate,
while the duplicate (no commas) is a `confident`-bucket candidate, and confident candidates are
always processed before singleton ones. Whichever import key `REVIEWED_DUPLICATE_IMPORT_KEY`
pointed at the survivor, the *duplicate* would still be the one to reach `upsertBook` first and
actually create the book — under its own (comma-less) title, in whichever locale its own site
data carries — which would produce a book with the wrong title, silently, rather than reproducing
what TASK-22 actually did. Fixing that properly means teaching the reconciliation step itself to
treat differing punctuation as the same title, which is a change to matching logic used across the
whole catalogue, not a fact about one pair of books. Left alone, with this paragraph as the
record: a from-scratch import of this one pair is not a valid rebuild, and production is that
pair's only copy.

**Not verified empirically, recorded as a gap:** whether `www.ramhal.com` will need its own
authorised domain and redirect URI entry added at that point (it will — see the OAuth client
`ramhal-admin` in the `machon-ramhal` Google Cloud project) was not tested against a live domain,
since that domain is not yet in use.

---

## 21. TASK-26: a real gap in `PaymentProvider`, against §5's "structured extension work" claim

§5 called `PaymentAdapter`-shaped interfaces "structured extension work, not fighting the
framework" — reasonable from reading the package, but untested against a real gateway until
TASK-26 actually wrote one. It mostly held. One real gap didn't: `PaymentRequest` carries a single
`returnUrl`; PayPal's hosted checkout has two distinct redirect targets, one for an approved
payment and one for a cancelled one. The interface has no `cancelUrl` at all.

**Why the gap exists:** `PaymentRequest`'s shape was written against the mock provider first — one
session record, one decision, always answered synchronously, always returning to the same page
regardless of what the customer chose. That has no cancel/approve distinction to carry, so the
interface never grew one. A payment interface designed from its first real gateway would very
likely have had two URLs from the start.

**The fix, not a workaround:** both of PayPal's redirect targets point at the same `returnUrl`.
`confirmPayment` asks the gateway what actually happened rather than inferring it from which link
was clicked — which the interface's own doc comment already required ("never taken from the
customer's browser"). This is arguably *better* than adding a `cancelUrl` would have been: a
return URL is buyer-typeable (nothing stops a customer from hand-editing it or a gateway from
mishandling it), so a design that never trusts *which* URL was hit is more correct than one that
does, not merely a smaller diff. Recorded as a finding rather than as a defect fixed, because nothing
about `PaymentProvider` needed to change to make it work.

**What this means for the Israeli gateway, whenever it is named:** expect more of this, not less.
§5's claim holds in the sense that matters — writing a second adapter did not require touching
Payload or restructuring the checkout flow — but the interface itself still carries assumptions
from being shaped by its first, synthetic implementation. Read it against the specific gateway's
own hosted-checkout shape before assuming it fits, rather than assuming "PayPal fit, so this will
too."

---

## 22. TASK-31: development gets its own database branch, and diagnostics is narrowed

§20 named the real cost of "one database everywhere" plainly and said it should be revisited
before the site has real customers. This is that revisit, triggered by a live, confirmed
consequence rather than a schedule: `GET /api/diagnostics` on the deployed demo showed local
`.env`'s `DATABASE_URI` was byte-identical to production's own (`ep-red-tree-b19ry3lo…`), and
TASK-29's report drew a wrong conclusion (local has a record production "does not") for exactly
that reason — local *was* production the whole time.

### Development gets its own Neon branch

A new, long-lived branch named **`development`** (`br-gentle-term-b11mvbu3`), forked
copy-on-write from **`production`** (`br-delicate-math-b1b1mbw7`) so the local catalogue is
realistic — the same pattern TASK-27 already used for the `testing` branch. Local `.env`'s
`DATABASE_URI` now points at it. To refresh it with production's latest data later: Neon console →
the branch → "Reset from parent" (destructive to whatever was written locally since the last
reset — documented in `.env.example`).

**The guard is reused, not rewritten.** `assertNotProductionDatabase` — the function that already
refused a test run pointed at production (TASK-27) — moved from `src/test/` to `src/lib/` (it's
runtime logic now, not test-only) and gained a second, generalised parameter (`guidance`) so both
callers get a message pointing at the right variable. `exitUnlessDevelopmentDatabaseIsSafe`
(`src/instrumentation.ts`) calls it under `APP_ENV=development` only — demo and production are
still meant to share the one production database, per §20; only development is being carved out
here. Verified for real, not just by inspection: pointed local `DATABASE_URI` at production's own
host with `APP_ENV=development` and started the app — it printed the refusal and exited before
`next dev` reported ready, the same way TASK-27's test-suite guard already did.

**Media: no new bucket, argued rather than assumed.** Local development already has all six
`S3_*` variables unset, so uploads already go to the local `media/` folder (`readMediaStorageSettings`)
— nothing to change there, but it's now a deliberate answer, not an accident of which variables
happened to be set. The remaining question was whether existing covers, whose `Media` rows carry
URLs pointing at production's bucket, would still render locally once local pointed at a
*different* database. Verified against the live site rather than assumed: `curl`ing the live
homepage shows cover URLs like
`https://br-delicate-math-b1b1mbw7.storage.c-5.eu-central-1.aws.neon.tech/ramhal-media/….webp` —
a plain public HTTPS URL, unauthenticated, independent of which database served the row that
contains it. The `development` branch (forked from production) carries the same URLs in its own
`Media` rows, so they render locally exactly as they do in production. Only a *new* local upload
is affected, and that already goes to disk, never to the production bucket.

**The trade, stated plainly, as §20 asked for:** content entered locally — a seed script, an
admin edit made against a `next dev` session — no longer reaches the live site. TASK-28 and
TASK-29 only appeared to work because problem 1 existed; that path is now deliberately closed.
From here on, real content reaches the live site only two ways: an allowlisted editor using the
real `/admin`, or a script explicitly pointed at production's own `DATABASE_URI` (a committed
one-off under `scripts/one-off/`, per the workflow protocol, never a routine seed script run
against a developer's `.env`).

### Production can now see its own backups

TASK-27 built the nightly `pg_dump` mechanism and a read-only reader credential
(`ramhal-backups-app-reader`, scope `storage:read` only, already narrower than the
`storage:read`+`storage:write` credential the GitHub Action itself writes with) — but the five
`BACKUP_S3_*` variables were only ever set in local `.env`, never in Vercel's Production
environment, so `GET /api/diagnostics` on the live site reported `"backup": null` regardless of
whether the nightly workflow was succeeding. Set in Vercel Production for the first time in this
task (`docs/reports/TASK-31.md` has the live verification).

**On scoping "to the bucket alone":** Neon's object-storage credentials (`create_credential`)
scope to `storage:read` / `storage:write` on a *branch*, not to one bucket within it — there is no
narrower scope Neon's API offers. `ramhal-backups-app-reader` (branch-wide read, no write) is
already the narrowest credential available, not a broader one chosen for convenience; recorded
here rather than treated as a gap, since the brief for this task asked to stop and report if a
bucket-scoped key wasn't available, and it isn't.

**The bucket check's own error is now generic on purpose.** `getBackupStatus`'s catch branch used
to return the AWS SDK's own error message verbatim — which, for a network or credential failure,
can contain the endpoint hostname. Since this route is public, that branch now logs the real
error server-side and returns a fixed, generic string (`src/lib/backupStatus.ts`); tested by
mocking a leaky SDK error and asserting the response never contains it.

### The public diagnostics payload is narrower

The live payload showed `database.host`, `database.name` and `database.user` to anyone —
three of a connection string's four parts. `GET /api/diagnostics` (`src/app/(payload)/api/diagnostics/route.ts`)
now returns those three only when the request carries a valid, authenticated Payload session.
`allowOnlyListedAdmins` (§19) is the *only* way any session is ever issued, so "authenticated" and
"admin" are the same fact here — no separate role check was needed. An anonymous request instead
gets `database.fingerprint`: a truncated SHA-256 of the connection host
(`computeDatabaseFingerprint`, `src/lib/diagnostics.ts`), stable and comparable without exposing
the value it's derived from. Production's is recorded in `docs/RECOVERY.md` as **`2c951382a7f8`**
so a stranger who only has the public endpoint can still answer "is this the database I expect?".
AGENTS.md's verification rule was updated to describe this. A dedicated test asserts the
unauthenticated response contains none of the host, the database name, the role name or the
password — the last already covered by an existing test, kept.

**Verifying "authenticated" for real, not by mocking `payload.auth`:** the local password login
strategy is disabled (§19/§20), so the integration test signs its own session token the same way
the codebase's own login path does — `payload.update`'s public Local API to attach a session
record to a throwaway user, then `jose`'s `SignJWT` (already a direct dependency) with the app's
own `PAYLOAD_SECRET` — and sends it as `Authorization: JWT …`. This exercises Payload's real JWT
verification, not a stand-in for it.

## 23. TASK-34: `www.ramhal.com` is the catalogue authority

The original migration treated product pages from `ramhal.com`, `frramhal.com` and
`enramhal.com` as three drifted views of one catalogue. That was deliberately conservative while
the desired inventory was unknown: unmatched French- and English-host records were imported and
flagged `absent-from-hebrew` instead of being discarded. It is also why TASK-22 correctly described
those records as editorial uncertainty rather than corruption at the time.

Emanuel has now resolved the uncertainty: the five book-category pages on **`www.ramhal.com`** —
three Hebrew pages, one French page and one English page — are the complete catalogue source of
truth. The other two domains may supply a translation, another currency price or a redirect URL
for a book that matches a `www.ramhal.com` listing; they may not create a book that is absent from
those five pages.

Verified against the live legacy pages and the live production database before deletion:

- the five pages contain 62 unique listings (51 Hebrew, 9 French, 2 English);
- every listing's exact `%2D`-preserving legacy URL maps to exactly one production book;
- no listing is missing and no listing maps to more than one book;
- the other 34 of production's 96 books have no `www.ramhal.com` legacy URL, exactly match the
  existing `absent-from-hebrew` review set, and have no order, cart, series, cover or gallery
  reference.

Those 34 records were deleted by the guarded, transactional TASK-34 one-off script. The importer
now refuses any reconciliation candidate without a Hebrew-domain (`site: 'he'`) source entry, so a
from-scratch import produces the same canonical set instead of recreating the drift. This also
supersedes §20's duplicate-import exceptions: cross-site-only variants no longer reach the import
at all, so the special import-key remaps and the punctuation-order caveat are unnecessary.

---

## 24. TASK-38: language is a field, not a category

Three of the four categories — `hebrew-books`, `french-books`, `english-books` — stored the same
fact as `books.bookLanguage`. The importer translated between the two in both directions
(`CATEGORY_TO_LANGUAGE`/`LANGUAGE_TO_CATEGORY`), and the storefront showed both: `/fr` offered
"Livres en hébreu" under Catégorie *and* "Hébreu" under Langue for the same book. Two fields
recording one fact drift apart, and the son had to set both by hand — the same shape of bug as the
legacy per-currency cloning §2 describes, just at field scale instead of site scale.

**The rule, from here on:** language lives only in `bookLanguage`. A category says what *kind of
work* a book is — its form or genre — never its language. Today the only real category is
`siddurim-machzorim`; the schema still supports adding more (קבלה, מוסר, …), left open for the
client.

**Why the `categories` collection stays instead of being removed:** it already models exactly what
a real, non-language category should be — see `siddurim-machzorim`. Removing the collection to fix
a *data* problem (three of its four rows encoding the wrong fact) would have thrown out a
correctly-shaped tool along with the one thing that was actually wrong.

**The audit, before anything was deleted:** a read-only check against both the development and
production databases (23 September 2026) found no book whose category contradicted its
`bookLanguage`, and no book with `bookLanguage = 'unknown'` in either database — so there was no
case where a category was the only surviving record of a book's language, and nothing to stop and
report. Production (62 books): `hebrew-books` 45, `french-books` 9, `english-books` 2,
`siddurim-machzorim` 6. Development (96 books, forked from production before TASK-34's cleanup so
its counts run higher): `hebrew-books` 61, `french-books` 24, `english-books` 2,
`siddurim-machzorim` 9. `scripts/one-off/TASK-38-remove-language-categories.mjs` reran both counts
inside its transaction immediately before writing, hardcoded per host, and aborts on any drift —
the same guard-then-act shape as TASK-34's script, generalised to run against either database
rather than refusing everywhere but one.

**Covers, unaffected by the removal:** `coverRuleColour` (`src/lib/cover.ts`) used to key the
frame's rule colour off the category slug directly, so deleting the three language categories
would have silently turned every French and English cover teal — the fallback colour. It now takes
the book's language and category together: `siddurim-machzorim` still gives `--gold-ink`; otherwise
`he`/`fr`/`en` give `--teal`/`--gold`/`--teal-deep` exactly as the old category-keyed rule did.
Visually identical for every book in the catalogue, verified in the browser before and after the
data migration — the code change and the data change were deliberately sequenced (code deployed
first, data migrated after) so this was never observably broken in between.

**The storefront category filter is conditional, not removed.** With only `siddurim-machzorim`
left, offering a "category" dropdown with one option (or the unfiltered "all") is not a real
choice — see docs/DESIGN.md's "Catalogue browsing". `CatalogueClient` now builds its category
options from whatever categories are actually populated on the catalogue's books, the same way it
already derives `languagesPresent`, and renders the control only when there are at least two. It
returns on its own, with no code change, the moment a second real category is in use — which is the
point: the model already supports more categories, so the UI shouldn't need a separate flag to
notice one arrived. `getCategories` (`lib/booksData.ts`) had no caller left once the filter stopped
needing the full collection unconditionally, so it was removed rather than left unused.

**Out of scope, recorded rather than fixed:** a `he-fr` or `aramaic-fr` book matches neither the
Hebrew nor the French language filter, since the filter is an exact match — no such book exists in
the catalogue today, so this is a note, not a bug fix. Redirects for legacy category-page URLs
were not added; none exist on the live site to begin with.
