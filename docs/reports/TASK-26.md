# TASK-26 — The payment gate: one real sandbox purchase, end to end

## What was built

- **A real PayPal adapter** (`src/lib/payment/paypal{Config,Mapping,Client,Provider}.ts`) —
  PayPal Orders API v2, intent `CAPTURE`, hosted approval page, second implementation of
  `PaymentProvider`. Split by what changes independently: config (env, all-or-none), mapping
  (pure request/response shaping — currency amounts, locale tags, outcome classification), client
  (one function per PayPal endpoint), provider (the interface implementation itself).
- **A webhook route**, `POST /api/webhooks/paypal` — the first webhook endpoint in this codebase.
  Verifies every request through PayPal's own `verify-webhook-signature` API before acting on
  anything, then settles orders through the exact same `markOrderPaid`/`markOrderPaymentUnsuccessful`
  functions the browser-return path already used, keyed on PayPal's own capture id. No parallel
  settlement path — `findOrderByProviderRef` (new, in `orderPayment.ts`) is the only new piece of
  shared machinery.
- **`exitUnlessPaymentConfigurationIsSafe` now constructs the whole configured provider**, not just
  reads its name — a misconfigured PayPal deployment fails at boot, matching the pattern already
  used for `ADMIN_ALLOWED_EMAILS` and Google sign-in.
- **`PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`/`PAYPAL_WEBHOOK_ID`/`PAYPAL_ENV`** documented in
  `.env.example`, required together when `PAYMENT_PROVIDER=paypal`. `PAYPAL_ENV` is independent of
  `APP_ENV` on purpose — see "What felt wrong."

## What was verified and how

- **Not verified: the real gate.** All five required exercises — a complete purchase, a cancel, a
  decline, a duplicate webhook, a tampered webhook — need real PayPal sandbox credentials and a
  URL PayPal can reach for webhook delivery. Neither existed in this session: the browser this
  session has access to is not signed into any PayPal account, and creating sandbox credentials
  myself was not something to do without asking. Asked directly; Emanuel chose to defer the live
  exercises to a follow-up rather than hand off PayPal access in this session. Said here plainly,
  not worked around, and not implied to have happened — **this is the primary open item of this
  report**, not a footnote.
- **What was verified instead**, against PayPal's actual documented request/response shapes (not
  invented ones) with the network calls mocked:
  - Currency correctness: `toPayPalAmount` sends the order's own currency and a two-decimal string
    amount, tested for ILS, EUR and USD individually and for a value floating point cannot
    represent exactly (`10.005` → `"10.01"`), asserted on the exact request body `createOrder` is
    called with — not by inspection.
  - The capture-on-return path: an `APPROVED` order gets captured and the fresh capture's real id
    becomes `providerEventId`; an already-`COMPLETED` order is read, not captured again; a refused
    capture (the shape PayPal's own sandbox negative-testing produces — an HTTP error, not a
    `DECLINED` capture object) maps to `failed` with a synthesised, deterministic id.
  - Idempotency of the "no PayPal event for a plain cancel" case: `cancelledConfirmation` and
    `declinedConfirmation` are pure functions of the order id, tested to return the identical
    event id across repeated calls and to never collide with each other for the same order.
  - The webhook route, against the **real database** (`route.integration.test.ts`, mocking only
    the two outbound PayPal network calls): a verified `PAYMENT.CAPTURE.COMPLETED` event settles a
    real order; an unverified (tampered) signature is rejected with the order left untouched; the
    identical event **replayed** a second time is confirmed a genuine no-op — one `paymentEvents`
    row, one settlement, checked by actually calling the route twice, not by reasoning about the
    unique constraint in the abstract; a request missing PayPal's own headers is rejected before
    the signature check even runs; an unrecognised event type and a capture for an unknown order
    are both acknowledged (200) without acting, so PayPal doesn't retry something retrying can't
    fix.
- `tsc --noEmit`, ESLint (0 errors), all 288 Vitest tests (up from 254 before this task — the real
  webhook-route test included, run against the same single production database TASK-24 established
  as the only one), and `next build` — all pass, checked before every commit.

## What felt wrong

- **The `PaymentRequest` interface doesn't have a cancel URL, and PayPal genuinely needs one.**
  §5's claim that a `PaymentAdapter`-shaped interface makes writing an adapter "structured
  extension work" mostly held — but this is the one real seam where the existing interface, built
  against the mock provider's shape, doesn't fit a real gateway cleanly. PayPal's hosted checkout
  has two distinct redirect targets (approve vs. cancel); `PaymentRequest` has one `returnUrl`.
  Resolved by pointing both PayPal URLs at the same `returnUrl` and having `confirmPayment` ask
  PayPal what actually happened rather than trusting which link was clicked — which the interface's
  own doc comment already demanded ("never taken from the customer's browser"), so the fix is more
  "the interface was already pointing at the right answer" than "the interface was wrong." Still,
  a genuine gap, reported rather than silently absorbed.
- **A hosted-checkout capture flow has two settlement paths by design, not by accident**, and
  that took real thought to get right rather than being obviously "structured extension work": the
  synchronous capture-on-return (for a customer who comes back to the site) and the asynchronous
  webhook (for one who doesn't, or whose browser round-trip fails) are not a primary path and a
  fallback — they are both real, and PayPal's own capture id is what makes converging them onto
  one settlement function safe rather than a source of double-charging bugs. The mock provider's
  shape (one session record, one decision, always answered synchronously) does not have this
  problem at all, which is worth saying plainly: **the mock provider, as a reference implementation
  for "what an adapter looks like," undersells how much of a real gateway's difficulty is about
  reconciling two notification paths, not about the API calls themselves.**
- **Sandbox negative testing (a forced decline) is itself an API-shaped concern, not a UI one** —
  PayPal's own documented mechanism is a request header that tells the sandbox to simulate a
  specific error, not a real declined card. That shaped `paypalClient.captureOrder`'s error
  handling (an HTTP error with no capture id, not a capture object with a `DECLINED` status) before
  a single real request had been sent — read from PayPal's own API reference, not guessed, but
  worth naming as the kind of detail that would have taken real trial-and-error to discover without
  documentation this precise.

## What is still open

- **The actual gate**: one complete sandbox purchase (ILS and a second currency), a cancel, a
  decline, a duplicate webhook, and a tampered webhook, all against the real PayPal sandbox. This
  needs, at minimum: a PayPal Developer sandbox app (client id/secret), a webhook subscription
  registered against a URL PayPal can reach (this app deployed somewhere public, or a tunnel to
  local dev), and a sandbox buyer account to actually click through the hosted approval page.
  None of this is committed to the repo and none of it should be attempted without Emanuel present
  to either grant PayPal account access or perform the account-level steps himself.
- **§14's hard gate is therefore still not closed.** The code half is done and, as far as
  automated testing without live credentials can show, correct; the actual "does the gateway fight
  us" question §14 exists to answer early is unanswered. That is the honest state of this task, not
  a detail to soften.
- **`PAYPAL_ENV`'s relationship to `APP_ENV` is a real design choice worth someone double-checking**
  once live credentials are ever in play: this task deliberately decoupled them (`APP_ENV` is about
  which deployment this is; `PAYPAL_ENV` is about which PayPal credentials a deployment holds), but
  nothing in the codebase currently *enforces* that a `production` `APP_ENV` cannot run with
  `PAYPAL_ENV=sandbox` (which would be a shop that looks live but takes no real money) — the same
  shape of risk `assertProviderAllowedInEnvironment` already guards against for the mock provider.
  Not guarded here because this task never touches `APP_ENV=production` at all; worth adding the
  same kind of check before a real live cutover.
