# TASK-09 — Checkout, with a mock payment provider

## Launch blocker owned by someone else

**A customer can now complete a purchase and receives no email.** Confirmation emails need a verified
sending domain, which is the institute's paperwork (out of scope here). The confirmation page says so
honestly — "no confirmation email is sent, keep your order number" — but that is a stopgap for a demo,
not something to launch with.

## What was built

Four commits on `main`: `41c1785` orders schema · `65c5a76` pure pricing/validation · `44108cb` payment
seam · `cc9fea0` storefront screens.

- **Orders.** `orders` collection, all labels Hebrew. Lines snapshot book (a link only, goes blank if the
  book is deleted), title as sold, unit price paid, currency, quantity, shipping units. Order-level
  currency/subtotal/shipping/total, zone, destination country, pickup, customer (name, email, phone,
  address), `paymentStatus` (pending/paid/failed/cancelled) and `fulfilmentStatus`
  (new/packed/posted/collected) as **separate fields**, provider, providerRef, paidAt. Money fields and
  status/provider fields are locked against admin/REST edits (field access), and a hook refuses any
  change to `total` even from server code. Nobody can create or delete an order through the API.
- **Order number = the order's `id`**, with the sequence restarted at 1001 by the migration. Sequential,
  stable, searchable, and no second counter to race or drift. Exposed as a virtual `orderNumber`.
- **`fulfilmentStatus` is null until the order is paid.** Deliberate: an abandoned checkout must not
  read as "new order to pack". It becomes `new` in the same transaction that marks the order paid.
- **Admin list.** Order number, date, customer, formatted total (₪55.00, not `5500`), both statuses,
  newest first. Three one-click buttons above the list: all / **שולם, טרם נשלח** (paid AND fulfilment
  new|packed) / ממתין לתשלום.
- **`PaymentProvider` interface** — `createPayment(request) -> {providerRef, redirectUrl}`,
  `confirmPayment(providerRef) -> {pending} | {paid|failed|cancelled, providerEventId}`. `MockPaymentProvider`
  is the only implementation. It keeps its own record (`mockPaymentSessions`, hidden, server-only) of
  what the customer chose, the way a real processor would, so `confirmPayment` answers from a store that
  is not the browser. **Delete `mockPaymentSessions` and `mockPaymentProvider.ts` when a real provider
  lands.**
- **Idempotency.** `paymentEvents.providerEventId` is `UNIQUE` (a real unique index in the migration).
  `markOrderPaid(orderId, providerEventId)` records the event and moves the order in one transaction; a
  duplicate is detected from the constraint violation, not from a read. A late `failed`/`cancelled` event
  never demotes a paid order; a `paid` event does promote a failed/cancelled one (money arrived).
- **The return URL proves nothing.** `/checkout/return/[token]` is a route handler that calls
  `settleOrderPayment` → `provider.confirmPayment` → `markOrderPaid` (or the unsuccessful equivalent).
  No outcome is read from a query parameter. The token is a random per-order value, not the order number.
- **Server-side pricing.** `placeOrder` re-reads every book, current price and stock from the database,
  and shipping zones, and builds the order from those. The only client number is `expectedTotal`, the
  total the customer was shown; it is **compared, never used**. A difference returns `total-changed`,
  creates nothing, and the form re-fetches so the customer sees the new total.
- **Screens.** `/checkout` (`/en`, `/fr`), the mock payment page with pay / decline / cancel,
  `/order/[token]` showing paid / declined / cancelled / still-waiting, each with its own copy in he/en/fr.
  Paid clears the cart; decline, cancel and abandonment leave it intact. Decline and cancel pages link
  back to the cart. Every mock screen (checkout, payment page, all outcome pages) carries an amber
  "demo only — no real payment" banner in the viewer's language.
- **Production refusal.** `src/instrumentation.ts` runs at server start; if `PAYMENT_PROVIDER=mock` and
  `NODE_ENV=production` the **process exits with code 1** and a message saying why. `getPaymentProvider()`
  and the mock page/action also refuse independently.

## What was verified and how

- **Gate** (run against the tree exactly as staged, per commit, via `git stash --keep-index`):
  `tsc --noEmit` clean · `eslint` 0 errors (18 warnings, all the generated migrations' unused
  `payload`/`req`, same as before) · `vitest` **21 files / 132 tests** · `next build` clean.
- **Tampered total (DoD 3):** `placeOrder.integration.test.ts` posts total `1` for two books and asserts
  `total-changed` and **no order row for that customer**. Mutation-checked: with the comparison disabled
  the test fails.
- **Duplicate confirmation (DoD 4):** `orderPayment.integration.test.ts` calls `markOrderPaid` twice with
  one event id (second is `already-processed`, order byte-identical, one event row), and fires **8 concurrent**
  calls (exactly one `applied`, seven `already-processed`, one event row) against the real Neon database.
- **Production boot (DoD 5):** unit test on the startup hook (exit(1) + message), **and** for real: after
  `next build`, `NODE_ENV=production next start` printed the refusal and exited with code 1 (port never
  answered). An earlier version merely threw from the hook; `next start` survived that and served HTTP 500
  to everything, so I made it exit.
- **Snapshot:** test creates a book, sells it, reprices then **deletes** the book; the order still reads
  correctly (title, unit price, total) with `book: null`.
- **Out of stock / not purchasable** name the book (unit + integration).
- **In a real browser** (dev server, real Neon DB; both mock outcomes and the return flow):
  - Hebrew, desktop: paid with delivery (#1024, 2 books, ₪160 + ₪30), decline (#1025), cancel (#1026),
    self-pickup paid (#1027 — shipping free, no address asked, "prepared for collection" copy).
  - French, desktop: paid (#1028), decline (#1035), cancel (#1036). A rejected phone number showed an
    inline error.
  - **414px**: Chrome would not shrink the window below 500px, so 414 was checked by loading the flow in
    a 414px-wide iframe (media queries evaluate at the iframe's width; measured inner width 412). French:
    decline (#1029), cancel (#1030), paid (#1031). Hebrew: decline (#1032), cancel (#1033), paid (#1034).
    RTL layout, banner, order pages and cart-kept-after-decline all read correctly; no horizontal overflow.
  - After every paid order the cart was empty; after decline/cancel "Retour au panier" showed the book
    still there.
  - Orders 1024–1036 were read back from the database: snapshot prices, shipping, `paymentStatus`,
    `fulfilmentStatus` (null unless paid), one `paymentEvents` row each, `paidAt` only on paid ones.
    They are still in the dev database.

## What was **not** verified

- **The admin, visually (DoD 6, and the "looked at the orders in the admin" half of DoD 8).** The dev
  database has no users, so `/admin` redirects to "create first user", which requires typing a password —
  something I do not do. The list config, the quick-filter component and the field layout have therefore
  **not been seen rendering**. What is verified: the collection config loads, the migration applied, the
  filter URL is unit-tested against Payload's `where` query shape, and the admin route returns 200 after
  the import-map fix below. **Someone needs to create a first user and look at `/admin/collections/orders`.**

## What felt wrong

- **Currency vs destination — needs a decision.** An order has one currency (the locale's) and shipping
  is charged in the destination zone's currency, so the checkout only offers countries whose zone is
  priced in the customer's currency: Hebrew → Israel only, French → the Europe zone, English → the
  rest-of-world zone. An English-language customer in Israel, or a French-language one in the US, cannot
  check out. That is the legacy per-currency split creeping back at the last step, and it contradicts
  DECISIONS §2 ("currency and shipping resolved at checkout by destination"). Fixing it properly means
  pricing books in the destination's currency, which is a product decision, not something to slip in here.
  Related: only countries *listed* in a zone are offered; a zone's `isDefault` fallback is not used at
  checkout, so the son controls who can order by editing the zones.
- **Demo hosting.** Because production refuses the mock, a deployed demo (e.g. Vercel, where
  `NODE_ENV=production`) will not start with `PAYMENT_PROVIDER=mock`. The demo must run under `next dev`
  or on a machine, or someone must decide on a deliberate override. I did not add one.
- **Order numbers in the dev DB start high.** Tests consume ids, so the first walkthrough order was
  #1024. A fresh production database starts at 1001. Gaps can also appear if an insert is rolled back.
- **Payload's dev tooling.** Migrating required deleting the stale `dev` marker row in
  `payload_migrations` (left by an earlier `next dev` schema push) — same as earlier tasks evidently did.
  Run `next dev` with `PAYLOAD_MIGRATING=true` to avoid re-creating it.
- **Import map.** `generate:importmap` is on the broken-CLI list (§15). `next dev` generated the admin
  import map with a wrong relative path until I set `admin.importMap.baseDir` to `src/` in
  `payload.config.ts`; I also corrected the committed `importMap.js` by hand to match. Worth re-checking
  after the next dev boot regenerates it.
- **A bug the browser found and I fixed:** React clears an uncontrolled form when its action returns, so
  a validation error wiped the customer's address. The action now hands the submitted values back.
- **Another:** a Server Action `redirect()` to the return route is a client-side navigation, so the
  address bar kept the return URL. The mock's buttons now finish with a full page load, like an external
  processor.
- **Not cleaned up:** abandoned pending orders accumulate forever. They read as "ממתין לתשלום" and
  never as a sale, but nothing expires them.
- **Money in the admin edit form is minor units** (agorot/cents) with a note; only the list column is
  formatted. Same wart as book prices.
- **Added beyond the brief:** `orders.locale` (which language to expect on the son's phone call) and the
  `paymentEvents` collection is visible read-only under "מערכת".

## What is still open

- **Confirmation emails** (see top).
- **Admin visual check** and the currency/destination decision above.
- **A real provider** needs: an absolute return URL (adapter prefixes a configured site address —
  `PaymentRequest.returnUrl` is currently a path), a webhook route that calls the same `markOrderPaid`,
  and the second `getPaymentProvider` branch. Nothing else should change.
- Refunds, stock quantities, TASK-08's data worklist, expiry of stale pending orders.
- Anyone pulling this needs `PAYMENT_PROVIDER=mock` in `.env` (see `.env.example`); without it the
  server exits at startup.
