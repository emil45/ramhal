# TASK-06 — Storefront

Build the storefront. This is the first task where the site becomes something a person can
look at. Save this brief as `docs/tasks/TASK-06-storefront.md` before starting, then
implement it.

## Orient first

`AGENTS.md` · `docs/PROJECT_CONTEXT.md` · `docs/DECISIONS.md` · `docs/reports/TASK-05.md`

The database has 128 books, three locales, three currencies, 7 real covers.

## Scope

In: catalogue, book page, cart, two short info pages, locale switching.
Out: checkout and payment (next task), articles, the shiur archive, the store's
order-management screens.

Branch `task/06-storefront`. Small commits.

## 1. Before anything: generate Payload types

`src/payload-types.ts` is missing, so every component would otherwise hand-write its own
shape of a Book. Generate it, commit it, and use it everywhere. If the CLI's
`generate:types` hits the same loader bug as `migrate` did, route around it the same way —
the pattern is already in the repo.

## 2. Routing and locales

Hebrew at the root: `/`, `/ספר/<slug>`. English and French prefixed: `/en`, `/fr`. Hebrew
NEVER gets a prefix. Adding a fourth locale must not require restructuring.

RTL-first. Logical properties only — `margin-inline-start`, never `margin-left`. Hebrew is
the default and English/French fall out of it. Do not build LTR and flip it.

## 3. Three decisions already made — implement, don't reconsider

**a) A book page must look finished without a description.** 101 of 128 books have no
description in at least one locale. That is the normal case, not an error state. The page
must read as complete from title, cover, price, category, language and edition alone. No
empty heading, no "description coming soon", no collapsed layout. If you design the page
assuming prose exists, most of the catalogue looks broken.

**b) No price in the viewer's currency = visible but not purchasable.** Do not hide the
book. This is a publisher whose stated mission is spreading these texts — a French visitor
should be able to learn a book exists even if they cannot buy it here. Show it, state
plainly that it is not available for purchase in this region, and point to contact. Same
treatment for the 8 books carrying a real 0.00 price: zero means no price, never free.
Nobody buys a five-volume set for nothing because an old site had a blank field.

**c) No search infrastructure.** 128 books is small. Ship the catalogue to the client and
filter there — by category, by book language, and by a title substring match. This
sidesteps the Hebrew full-text problem entirely (Postgres has no Hebrew configuration, and
solving that properly is a real project). Normalise gershayim and quote variants when
matching, since רמח״ל and רמח"ל and רמחל must all find the same book.

## 4. Pages

**Catalogue (the home page).** Books visible immediately — this is a shop, and people
arrive wanting to find a book. Cover, title, one-line subtitle, price. Filters as above. No
hero that pushes the catalogue below the fold.

**Book page.** Cover, title, author/editor, price, add-to-cart, availability, category,
language, publisher. Description where it exists. Shipping terms stated where people look
for them.

**Cart.** Line items, quantities, remove, subtotal. Shipping via `lib/shipping.ts` — do NOT
reimplement the rules. Destination is unknown until checkout, so infer the zone from the
locale and label it clearly as an estimate. Show the free-shipping nudge: "another N books
and shipping is free." It is their real rule and it is worth surfacing.

**Info pages.** Two short ones: who the Ramhal was, and who Rabbi Chriqui is. Content is in
`PROJECT_CONTEXT.md`. Short — someone deciding whether to buy מסילת ישרים wants thirty
seconds, not an essay.

## 5. Covers — 121 books have none

Do not ship a grey placeholder box across most of the catalogue. Build a typographic
fallback cover: the book's own title, well set, on a ground coloured by category, with a
thin rule frame. It should read as a modest book cover, not as a missing image.

Use `next/image` for real covers. The fallback is rendered, not an image file.

## 6. Visual direction — settled, do not reinterpret

The brand, sampled from the institute's own logo:

```
--teal      #00707C   primary
--teal-deep #004F58
--gold      #B08D42   accent, used sparingly
```

Light background. White or near-white. NOT dark.

Type: Heebo or Assistant for interface and body — what Israeli sites actually use, clean
and highly readable. Frank Ruhl Libre is acceptable for book titles and cover fallbacks,
where a book-like serif suits.

The register is a good, plain bookshop that a religious Jewish reader would find easy and
trustworthy. NOT a museum, NOT a dark "digital library", NOT a tech product. Three earlier
design directions were rejected for exactly that. People arrive to buy a book and read a
little about the Ramhal. Serve that.

Logo and photographs are in `public/`. The logo is ornate — use it at a size where it reads.

## 7. Technical

- Payload Local API in server components. Never fetch your own REST API from the client.
- Catalogue and book pages static per locale, revalidated on publish. Cart is dynamic.
- Cart lives in the Payload `carts` collection, keyed by an httpOnly session cookie. Not
  localStorage. Checkout and the count-based shipping tiers both need the cart server-side,
  and building it client-side now means rewriting it next task.
- Prices are integers in minor units. Format for display at the edge, never store a
  formatted string. Currency by locale: he→ILS, fr→EUR, en→USD.
- `needsReview` and its flags are INTERNAL. They never affect what a visitor sees. The only
  thing that gates purchasability is whether a real price exists.
- Business logic in `lib/` as pure functions with tests: price selection and formatting,
  availability, the filter/normalisation for search. Components render; they do not decide.

## 8. Definition of done

- `/`, `/en`, `/fr` all render the catalogue in the right language, currency and direction
- a Hebrew book with no French description looks finished at `/fr/...`
- a book with no EUR price shows at `/fr` as visible-but-not-purchasable
- one of the 8 zero-price books cannot be added to the cart
- a book with no cover has a real typographic cover, not a placeholder
- adding two books, then eight more, shows the free-shipping threshold being crossed
- searching רמח"ל finds books titled רמח״ל
- it works at 400px wide with no horizontal scroll
- no physical left/right CSS anywhere

## 9. Finish by

Writing `docs/reports/TASK-06.md`, and taking screenshots of the catalogue, a book page,
and the cart — in Hebrew and in French.
