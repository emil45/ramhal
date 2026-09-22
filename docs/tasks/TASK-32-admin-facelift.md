# TASK-32 — Admin panel: make it clear, warm and easy for the son

(Confirmed unused before starting: no `docs/tasks/TASK-32-*.md` or `docs/reports/TASK-32.md`
existed, and no reference to "TASK-32" appears anywhere in the repo or git history.)

## Who this is for

One person, the Rav's son. Hebrew-speaking, not technical, does all administration alone
(`docs/DECISIONS.md` §3). Today's admin is Payload's stock English-shaped layout translated to
Hebrew: long flat forms, raw `true`/`false`, migration plumbing in his face, and — the specific
bug below — French-only books that render as `<ללא כותרת>` because their Hebrew title genuinely
does not exist. Everything here is built with Payload's own supported customisation points
(`admin.components.*`, field-level `admin`/`validate`, CSS custom properties). Nothing forks or
patches Payload.

## 1. The locale problem — investigated empirically, not assumed

### 1a. What actually happens (reproduced, not guessed)

Book id 88 (`Les Soixante Dix Arrangements Tome1`) has a title, slug and price only in `fr`;
`title.he` and `slug.he` do not exist. Reproduced the exact admin action — locale set to `he`,
only `prices[0].amount` changed — through Payload's Local API (same field-validation path the
admin form triggers), against the real development database, without needing a browser session:

```
SAVE FAILED.
Error name: ValidationError
Error message: The following fields are invalid: כותרת, כתובת ישנה (Slug, לכל שפה)
{
  "errors": [
    { "label": "כותרת", "message": "This field is required.", "path": "title" },
    { "label": "כתובת ישנה (Slug, לכל שפה)", "message": "This field is required.", "path": "slug" }
  ]
}
```

**Root cause, confirmed by reading Payload's own field-validation code**
(`node_modules/payload/dist/fields/hooks/beforeChange/promise.js`): on every `update`, Payload
re-validates *every* required field of the document at the request's locale, merged against the
existing doc for that locale — not only the fields present in the update payload. A French-only
book has no `he` row in `books_locales` at all, so `title`/`slug` resolve to empty for `he` and
the default required-check fails, even though the son never touched them.

**This is not unique to Books.** The same shape — `required: true` + `localized: true` on a
`title` field, with real documents that only exist in one language — is also on `Articles.title`
(Articles.ts's own comment already says a French-only parsha essay is normal), confirmed against
the live development database:

| Table | `title` | `slug` |
|---|---|---|
| `books_locales` | `NOT NULL` | `NOT NULL` |
| `articles_locales` | `NOT NULL` | — (not a field) |
| `categories_locales` | `NOT NULL` | — (not localized) |
| `pages_locales` | `NOT NULL` | — (not localized) |
| `announcements_locales` | `NOT NULL` | — |
| `events_locales` | `NOT NULL` | — |
| `series_locales` | `NOT NULL` | — |

So the identical crash is latent on Articles today (an editor touching `publishedAt` on a
French-only parsha essay while the admin's content-locale is `he`), and structurally impossible
to hit on Categories/Pages/Announcements/Events/Series only because nothing has created a
document in those collections that isn't already in `he`. Fixing it in one place and not the
others would leave a trap for the next content that happens not to start in Hebrew.

### 1b. The fix

**`title` stays required, but "required" means "required in at least one locale," not "required
in the locale currently open."** A shared validator, used everywhere a localized title is
required:

- `src/lib/localizedField.ts` — pure, framework-free: `hasValueInAnyLocale(valuesByLocale)`,
  given a `{ locale: value }` map, tested directly with plain objects (per AGENTS.md, business
  logic lives in `lib/` and is tested without booting Payload).
- `src/collections/validators/requiredInAtLeastOneLocale.ts` — the Payload-facing glue (same
  pattern as `src/collections/hooks/generateSlugFromTitle.ts`): a field `validate` factory that,
  when the current locale's value is empty, does one `payload.findByID({ locale: 'all', depth: 0
  })` to check whether any other locale already has a value, and only fails if none does. A new
  document (`id` not yet assigned) still requires a title outright — there is nothing to fall
  back to yet.

Applied to `title` on Books, Articles, Categories, Pages, Announcements, Events, Series — the
complete set of localized-required title fields — replacing the framework's default per-locale
required check. **Requires a migration**: `required: true` still drives Drizzle's `NOT NULL`
generation regardless of a custom `validate`, so `books_locales.title`,
`articles_locales.title`, `categories_locales.title`, `pages_locales.title`,
`announcements_locales.title`, `events_locales.title`, `series_locales.title` all need their
`NOT NULL` constraint dropped (schema config keeps `required: true` for the admin asterisk and
docs; the DB constraint is what has to relax, since Payload will otherwise try to write a `NULL`
title into whichever locale's row is genuinely blank). This is exactly the schema change the
task's own rules anticipate ("a committed migration ONLY if a field's required-ness must
change").

**`slug` (Books' legacy, per-locale slug) is different: it stops being required at all**, per
§3 below — it is import plumbing, not editorial content, so there is no "must exist somewhere"
rule for it, only "not required, hidden." Also needs the `NOT NULL` dropped
(`books_locales.slug`).

One migration, one clear purpose: `npm run migrate:create` after the field changes, reviewed
before commit.

### 1c. Display title, with a language badge — every localized collection

**For display only — list columns, relationship pickers, the edit-view breadcrumb — never
written back to the data.** A virtual field, `displayTitle` (plus `displayTitleLocale` for the
badge), added next to `title` on the same seven collections, following the exact pattern already
in this codebase for admin-only computed values (`Orders.orderNumber`, `Orders.formattedTotal`:
`virtual: true` + an `afterRead` hook, `admin: { readOnly: true }`). Its `afterRead` hook does one
`payload.findByID({ locale: 'all', depth: 0 })` and returns the first non-empty value in
`he → fr → en` order, plus which locale it came from. Set as the collection's `useAsTitle` —
Payload uses that same field for the list, for the document's own header, and for how it's
rendered inside a relationship picker, so one field fixes all three surfaces at once.

**The honest cost, stated plainly:** this is one extra tiny `findByID` per row shown, on top of
the list's own query. At this catalogue's size (~130 books, paginated, one low-traffic admin
user) that's sub-second and not worth optimising away with a second storage mechanism that could
drift out of sync with the real title. Revisit only if the catalogue grows by an order of
magnitude.

The badge itself is a small custom `Cell` component (`src/components/admin/LanguageBadge.tsx`)
reading `displayTitleLocale`, rendered next to the title in list views — `עברית` / `Français` /
`English`, not a flag (DESIGN.md already rejects flags-as-meaning for the storefront's language
picker; same reasoning applies here).

## 2. Theme: warm, branded, readable

**Finding, from reading Payload's own compiled CSS
(`node_modules/@payloadcms/ui/dist/styles.css`):** Payload 3's admin has no separate "brand" or
"primary action" colour token at all. Every surface — backgrounds, borders, and a primary
button's hover/active state — derives from one neutral `--theme-elevation-0` … `--theme-elevation-1000`
ramp; only `--theme-success-*` / `--theme-error-*` / `--theme-warning-*` carry hue. So the only
way to make the *whole* panel read as branded, not just a logo in the corner, is to retint that
elevation ramp itself — light steps warmed toward `paper`/`paper-deep`, dark steps shifted toward
`teal-deep` — rather than inventing new variables Payload's own components never read.

**Mechanism**: Payload's own supported path for this is a CSS file imported after
`@payloadcms/next/css` in `src/app/(payload)/layout.tsx` (untouched otherwise), defining the
overrides under `:root[data-theme='light']` and `:root[data-theme='dark']` — the same two
selectors Payload's own stylesheet uses, confirmed by reading it, so no new mechanism is
introduced. Values reference this repo's own tokens (`--teal`, `--teal-deep`, `--gold`, `--paper`,
`--paper-deep`) via `color-mix()`, not new hex values.

**Default theme**: propose **light**, to match `paper` as the storefront's ground and because
`--gold` is already only 3:1 on paper (DESIGN.md) — verifying it against a *retinted dark*
elevation ramp as well would be two contrast surfaces to defend instead of one, for no real
gain. Payload's `theme` config option (`'all' | 'dark' | 'light'`) *restricts* to one theme and
removes the toggle — not wanted here, since the task asks to keep both legible, not to remove the
choice. Whether Payload exposes a way to set the *initial*, pre-preference theme separately from
restricting is not yet confirmed from the type signature alone — **check empirically during
build** (`node_modules/@payloadcms/next` theme-detection code, or accept `auto`/system-preference
as the honest answer and document that instead of asserting a default that doesn't exist).

**Font**: `Assistant`, matching the storefront (`docs/DESIGN.md`), self-hosted the same way —
`next/font/google` in `src/app/(payload)/layout.tsx`, its CSS variable applied to the admin body
in the same override stylesheet. David Libre is not needed in the admin; it is a storefront
typographic device, not an interface font.

**Graphics**: the institute logo (`docs/PROJECT_CONTEXT.md` §13, `public/`) as
`admin.components.graphics.Logo` (login screen) and `Icon` (nav header), via
`admin.components.graphics`.

**Contrast**: checked with the relative-luminance/contrast-ratio formula (WCAG 2.1), not by eye,
against both the light and dark elevation ramps, for: body text, primary-button text, badge text
(במלאי/אזל, paid/unpaid), and gold-on-paper where gold text survives into the admin (kept to
`gold-ink`, never plain `gold`, exactly as DESIGN.md already requires for the storefront).
Numbers go in the report.

## 3. Forms: short, grouped, obvious

Tabs and sidebar placement per collection. "Sidebar" below means Payload's field-level
`admin.position: 'sidebar'`; "Advanced" tab means a `tabs` field grouping technical fields
together, not hidden unless stated.

**Books** (`src/collections/Books.ts`) — the model for the rest:
- Tab **פרטי הספר**: `title`, `subtitle`, `description`, `cover`, `gallery`, `hebrewYear`, `isbn`,
  `publishedAt`, `relatedSeries`.
- Tab **מחיר ומלאי**: `prices` (each row: `currency` and `amount` side by side via a `row` field —
  today they stack), `shippingUnits`.
- Tab **מתקדם**: `urlSlug` (kept visible and editable here — it is the one real public URL, not
  plumbing), `needsReview`, `reviewReasons`, `reviewNote`. `slug`, `legacyUrls`, `importKey`,
  `importedAt` moved to `admin.hidden: true` — nothing should ever edit these by hand, matching
  the precedent already set by `legacyUrls`.
- Sidebar: `bookLanguage`, `category`, `inStock`, `displayTitleLocale`'s badge is shown inline in
  lists, not the sidebar.
- Every non-obvious field gets a one-line Hebrew `admin.description` it does not already have
  (`hebrewYear`, `isbn`, `shippingUnits`, `relatedSeries`).

**Categories** — no tabs needed (two fields); add a Hebrew description to `slug` and leave it be.

**Series**: Tab **פרטים**: `title`, `description`, `relatedBook`, `youtubePlaylistId`. Sidebar:
`language`, `order`.

**Articles**: Tab **תוכן**: `title`, `body`, `publishedAt`. Sidebar: `type`, `parsha`/`holiday`
(already conditional on `type`, unaffected). `legacyUrls` → `admin.hidden: true`, matching Books.

**Pages**: single tab is enough (`title`, `body`); `slug` and `legacyUrls` → `admin.hidden: true`
(same reasoning as Books — nothing should hand-edit an institutional page's URL once set, and
`legacyUrls` is already hidden precedent-wide).

**Announcements** / **Events**: Tab **תוכן**: `title`, `body`/`description`, `image`, `link`.
Sidebar: `startsAt`, `endsAt` (Events also: `location`). Dates belong beside each other, not
buried under content — they are the fields that decide whether the item is even live (§9 of
DECISIONS: "anything dated expires itself").

**Orders** — mostly server-written (`setByServerOnly`), so tabs buy little; group instead:
- Sidebar: `paymentStatus` (as a coloured badge, read-only), `fulfilmentStatus` (the one field the
  son actually changes), `formattedTotal`, `locale`.
- Main: `customer` (already a group — render its `address` sub-group as a titled block, not a
  flat run of four fields), `lines`.
- **A field does not exist for this task to surface**: DECISIONS §8 and the pasted brief both
  name a "phone wants a call" flag as used daily. It is not in `Orders.ts` — only `provider`
  (server-set, e.g. `'mock' | 'paypal'`) exists, and no pay-by-phone adapter has been built yet
  (§8: PayPal is the only real gateway so far). **Not fabricated here.** This task is layout and
  admin config only, per its own rules; adding a new field that changes what an order *means* is
  out of scope and is flagged for a future task once pay-by-phone is actually implemented.
- List columns: `orderNumber`, `createdAt`, `customer.name`, `customer.phone`, `formattedTotal`,
  `paymentStatus` (badge), `fulfilmentStatus` (badge). **Verify empirically during
  implementation** whether Payload's list view actually renders a *nested* group path
  (`customer.name`) in `defaultColumns` — the current config already lists `customer.name` and
  this has not been confirmed to render correctly; if it doesn't, promote a virtual top-level
  `customerName`/`customerPhone` the same way `orderNumber` already works, rather than leaving a
  silently-broken column.
- Keep `OrderQuickFilters` (already good, matches this task's spirit) and extend
  `ORDER_LIST_FILTERS` if a badge/column change suggests an obviously missing one-click view.

**Users / PaymentEvents / MockPaymentSessions / Carts**: no form changes — `Users` is two
fields and already fine; the other three are server-only and already hidden from or restricted
in the nav.

## 4. Lists: scannable

- **Books**: cover thumbnail (small, from the `thumbnail` image size Media already generates),
  `displayTitle` + `LanguageBadge`, `category`, price (first entry, formatted), `inStock` as a
  Hebrew badge component (`במלאי` teal / `אזל` muted), not the raw checkbox glyph. Same
  boolean-to-badge treatment applied everywhere else a checkbox is a default column
  (`isPickup`, any future one).
- **`needsReview`** dropped from `defaultColumns` (true on nearly every row today — confirmed by
  reading the reconciliation comments in `Books.ts`, not re-measured here) and replaced by an
  `OrderQuickFilters`-style one-click filter link (`דורש בדיקה` → pre-filtered list), the same
  supported mechanism already proven on Orders.
- **Orders / Announcements / Events**: see §3 for columns; `defaultSort: '-createdAt'` already
  exists on Orders and is kept; add the same `-startsAt`/`-createdAt` default sort to
  Announcements and Events where absent.

## 5. Dashboard: "what needs me today"

**Finding**: Payload 3.89 ships a real (labelled *experimental*) `admin.dashboard` widget API
(`DashboardConfig`/`Widget` in `payload`'s own types) alongside the older, always-supported route
of replacing `admin.components.views.dashboard` outright with a custom Server Component. Given
this dashboard needs a specific, opinionated Hebrew layout (four distinct query-backed sections
plus quick actions) rather than a grid of independent widgets, and given the experimental API's
shape is still moving, **replace `views.dashboard` directly** with one Server Component
(`src/components/admin/Dashboard.tsx`) that runs real Payload Local API queries at request time:

- New/unpaid orders and orders wanting fulfilment (`paymentStatus: pending` count +
  `paymentStatus: paid, fulfilmentStatus: in [new, packed]` count), each linking into the same
  `ORDER_LIST_FILTERS` links already built for §3.
- Books missing a cover, a price, or a description — three counts, each a link to
  `/admin/collections/books` pre-filtered (`where[cover][exists]=false`, etc.), the same
  query-string mechanism `orderListFilters.ts` already uses, extracted into one small shared
  helper (`src/lib/adminListFilters.ts`) since Orders, Books and this dashboard will all build
  the same shape of filtered link.
- Upcoming events (`startsAt` in the future, `endsAt` empty or in the future) and active
  announcements (`startsAt` ≤ now ≤ `endsAt` or `endsAt` empty), both real queries — no static
  copy, matching the collections' own "anything dated expires itself" design (DECISIONS §9).
- Quick actions: three links to the relevant collection's create view
  (`/admin/collections/announcements/create`, etc.) — Payload's own URL scheme, not a custom
  route.

All counts are live queries issued from the Server Component via the Local API
(`payload.count`/`payload.find({ limit: 0 })`), never a number written by hand.

## Rules carried over from the brief, unchanged

- Layout and admin config only. The two exceptions, both already justified above, are the
  `NOT NULL` drop on the seven `title` columns plus `books_locales.slug` — both required-ness
  changes, both in one migration, both explained in §1.
- RTL correct throughout — logical properties only in every custom component
  (`src/components/admin/*`), checked visually once built (tabs, sidebar, badges, dashboard
  grid).
- Custom components: small, typed, one pattern (matches `OrderQuickFilters.tsx`'s existing style
  — inline styles keyed to `--theme-*` variables, not a new CSS approach), Hebrew labels, no dead
  code.
- Nav grouping (`admin.group` per collection, `admin.hidden` for the rest): **חנות** (Books,
  Categories, Orders), **תוכן** (Announcements, Events, Pages, Articles, Series, Lessons),
  **מערכת** (Users; `PaymentEvents` already has `group: 'מערכת'`). `MockPaymentSessions` and
  `Carts` are already `admin.hidden: true` and stay that way.

## Verification

- `tsc --noEmit`, ESLint, Vitest, `next build` before every commit — no exceptions.
- The French-book save from §1a re-run after the fix and passing (price-only update, locale
  `he`, book 88).
- Before/after screenshots of: dashboard, Books list, one Hebrew book, one French book, Orders
  list — saved under `docs/reports/TASK-32/`.
- Checked on the live `/admin` after deploy, signed in with Google, per AGENTS.md. This task
  cannot push (`main` is pushed by Emanuel); the report says what was verified locally and what
  still needs the post-deploy check.
- Contrast numbers (not a description of "looks fine") for the theme choices in §2.
