# TASK-06 — Storefront

## What was built

**Routing.** `src/proxy.ts` rewrites any unprefixed request onto `/he/...` invisibly (Hebrew
carries no URL prefix); `/en` and `/fr` are handled natively by `app/(frontend)/[locale]`.
Adding a fourth locale means one entry in `lib/locale.ts`'s `LOCALES`/`LOCALE_CONFIG` and one
in `src/proxy.ts`'s `PREFIXED_LOCALES` — no route restructuring.

**Payload types.** `src/payload-types.ts` is generated and committed. `generate:types` hit the
identical loader bug `migrate` did (TASK-05); routed around it the same way — a dev-only route
(`dev-generate-types`) that imports the generator by its resolved `file://` URL (not subject to
Node's package-exports restriction, unlike importing it by specifier) through a `new Function`
wrapper (so Turbopack, which statically traces ordinary `import()` calls, treats it as a genuine
runtime import rather than something to bundle ahead of time).

**Pages.** Catalogue (all 128 books, client-side filtered by category/language/title
substring — no search infrastructure, per §3c), book page, cart, and two short bios
(`/ramhal`, `/rabbi-chriqui`). The three decisions in the brief §3 are implemented as data, not
copy: `lib/availability.ts#isPurchasable` is the one gate on purchasability (a real, positive
price in the viewer's currency — a missing price and a real 0.00 both fail it, deliberately the
same way); `lib/booksData.ts` resolves title/slug across locales (structural — a card needs a
name and a link) while never falling back a description (editorial content, §3a); `lib/bookSearch.ts`
normalises gershayim/quote variants before matching.

**Cart.** Lives in the new `carts` Payload collection, keyed by an httpOnly session cookie
(`src/lib/serverCart.ts`), all API/admin access closed — only the Local API, from
`cartActions.ts`'s three Server Actions, ever touches it. Quantity, removal, subtotal, and a
shipping estimate + free-shipping nudge from the existing `lib/shipping.ts`/new `lib/cart.ts` —
no shipping rule reimplemented.

**Covers.** `TypographicCover` renders the title on a category-coloured ground with a rule
frame for the 121 of 128 books with no scanned cover; `CoverImage` uses `next/image` for the 7
that do, falling back automatically when a cover is absent or malformed.

**Visual direction.** `--teal`/`--teal-deep`/`--gold` sampled from the institute's logo, warm
paper background, Heebo (UI) + Frank Ruhl Libre (titles/covers), applied via `next/font/google`
in `[locale]/layout.tsx`. Logo and one Rabbi Chriqui photo copied from `public/`'s originals
(resized from several MB to ~100–200KB before committing).

## What was verified and how

- `npx tsc --noEmit`, `npx vitest run` (79 tests across 12 files, all lib/ business logic —
  price selection/formatting, availability, search normalisation/filtering, cart math, routing —
  tested), `npx eslint` — all clean.
- **A full `next build`** (not just `next dev`): compiled successfully, 392 static pages
  generated (catalogue × 3 locales, ~124 books × 3 locales — a few of the 128 have no usable
  slug in any locale and are skipped by `generateStaticParams`, 2 info pages × 3 locales), cart
  correctly left dynamic (`ƒ`), no errors or warnings beyond the pre-existing pg SSL notice.
- **Manual, in-browser verification of every `Definition of done` bullet**, against the real
  database (128 books, 7 real covers, from TASK-05's re-import):
  - `/`, `/en`, `/fr` render the catalogue in the right language, currency, and direction
    (screenshots below).
  - A Hebrew-only book (`tikoun-olam`, no `fr` locale row at all) renders complete at
    `/fr/livre/tikoun-olam`: title falls back honestly, no empty description block, category/
    language/publisher/shipping-note all present.
  - The same book has no EUR or ILS price in some cases and correctly shows "Non disponible à
    l'achat dans cette région" / "לא זמין לרכישה באזור זה" with no Add-to-cart button.
  - The EUR-0.00 book (`דברות רמח"ל ח"ה משיח`, one of the 8 real-zero-price books from
    TASK-05) shows the same unavailable state — confirmed it renders no Add-to-cart control in
    either the currency it's missing or the currency where it's a real zero.
  - Added a book, set quantity to 10 (crossing the seeded `freeAboveUnits: 10`): shipping
    estimate went to ₪0.00/€0.00 and the nudge switched to "משלוח חינם! / Livraison gratuite !" —
    live in the browser, not just in `lib/cart.test.ts`.
  - Typed `רמח"ל` (ASCII quote) into the catalogue search: 34 results, all titled with the real
    גרשיים variant — confirms `normalizeForSearch`.
  - Resized to ~400–500px: catalogue drops to a 2-column grid, the book page stacks
    cover-then-content, the cart stacks line-then-controls — no horizontal scroll observed.
  - `grep`ed every new file for physical-direction utilities (`ml-`, `mr-`, `pl-`, `pr-`,
    `left-`, `right-`, `text-left`, `text-right`, `border-l/r`, `rounded-l/r`) — none found.

## Three real bugs found by actually running it, not by reading the code

- **Functions can't cross the server→client prop boundary.** `dictionary.ts` has two
  pluralised-phrase entries as functions; passing the whole `dict` object from a server page into
  a client component (`CatalogueClient`, `AddToCartButton`, `CartLineControls`) crashed at
  runtime with a React error naming the exact function. Fixed by having those three components
  call `getDictionary(locale)` themselves — `dictionary.ts` has no server-only dependency, so
  that's safe — instead of receiving it as a prop.
- **Next 16 does not decode a non-ASCII dynamic route param.** `/ספר/<slug>` 404'd on every
  request; the page's own `bookWord`/`slug` params arrived still percent-encoded
  (`'%D7%A1%D7%A4%D7%A8'`), so comparing them against real Hebrew strings never matched. Fixed
  with an explicit `decodeURIComponent` at the point of use. Verified this is a Next behaviour,
  not a proxy-rewrite artifact, by hitting an already-prefixed `/fr/livre/<hebrew-slug>` path
  directly (bypassing the rewrite) and seeing the identical raw param.
- **A wrong-field bug in the search filter.** `CatalogueClient` fed `filterCatalogue` the book's
  raw, per-locale `title` (from `Omit<Book, 'category'>`, so still present on the merged object)
  instead of the already-locale-resolved `displayTitle` computed in `lib/booksData.ts`. For any
  book with no title row in the current locale, `title` was `undefined`, and typing anything into
  the search box crashed `normalizeForSearch` on `.replace` of `undefined`. Only surfaced by
  actually typing into the search box in the browser — vitest's `bookSearch.test.ts` only ever
  exercised the pure function with well-formed strings.

## Screenshots

Hebrew: catalogue, catalogue narrow (~500px), book page (with description, purchasable), cart
(free shipping reached), catalogue search for `רמח"ל`.
French: catalogue, book page (no description, unavailable-in-region), cart (EUR, same session
as the Hebrew cart above — same books, converted currency).

(Filenames given to the user in-chat; not committed to the repo as binary screenshots.)

## What felt wrong

- **No per-book author/editor field exists**, and none was added. The scraper captured a
  `publisher` string per product (mostly "Machon Ramhal" in the site's own language, but a
  handful of Hebrew entries name a different Rav entirely — real variation, not noise), but it
  was never wired into the `Books` collection during TASK-05's import, and backfilling it now
  would mean re-running the whole import against the real database again for one field. Rather
  than guess an author (this catalogue is not exclusively Ramhal's own texts — it includes CDs
  and siddurim) the book page shows a fixed, always-true "Publisher: Machon Ramhal" line instead
  of a per-book fact it doesn't have. Real per-book author/editor/publisher data is a scraper +
  re-import task, not a UI task — flagged here rather than fabricated.
- **The locale switcher always lands on the target locale's catalogue root**, not the equivalent
  book or page. A book's slug is a genuinely different string per locale (localized field), so
  carrying "the same book, other language" across a switch means looking up that book's
  other-locale slug before navigating — a real feature, not a one-line fix, and out of scope for
  getting the storefront's core paths working first.
- **Catalogue/book pages revalidate on a one-hour timer (`revalidate = 3600`)**, not on publish.
  Wiring a Payload `afterChange` hook to call Next's on-demand revalidation is a small addition
  but touches the collection layer and was left out to keep this task's diff to the storefront
  itself.
- The ambiguous-match records from TASK-05's import (e.g. two separate `דברות רמח"ל ח"ה משיח`
  book records — one Hebrew-priced and purchasable, one French-priced at a real 0.00 and not) now
  show up in the catalogue as two visually near-identical cards. That's correct per the import's
  own design (two real, distinct records, both honestly flagged `ambiguous-match` for the son to
  resolve), but it's the first time it's been visible to an actual visitor rather than only in
  the admin, and it looks odd without knowing why.

## What is still open

- Checkout and payment (explicitly next task).
- Articles, the shiur archive, and the store's order-management screens (explicitly out of
  scope).
- Author/editor field and its backfill (see above).
- On-demand revalidation on publish (see above).
- The locale switcher's book-equivalence limitation (see above).
- The two info pages are hand-written, not Payload-backed — fine at two pages, but if a third
  or fourth institutional page is ever wanted, that's the point to move them into the existing
  `Pages` collection instead of adding more hardcoded route files.
