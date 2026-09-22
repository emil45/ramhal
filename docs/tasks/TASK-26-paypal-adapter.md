# TASK-26 — The payment gate: one real sandbox purchase, end to end

Picked up cold. Read `AGENTS.md`, `docs/DECISIONS.md` §5/§8/§10/§14/§18, and every file in
`src/lib/payment/` before writing anything. Work on `main` (§17). This file is written from the
brief before starting; `docs/reports/TASK-26.md` is written last.

## Why this task exists

§14's hard gate: stand up the Hebrew admin (done — TASK-20/24) and push exactly one sandbox
purchase through the real payment provider, end to end, before any more feature code. The payment
half has been deferred for roughly 25 tasks. Everything built since assumes the `PaymentProvider`
interface and the gateway behind it actually work; nobody has tested that.

## Already read, not re-derived

- `src/lib/payment/paymentProvider.ts` — the `PaymentProvider` interface: `createPayment`,
  `confirmPayment`. `PaymentRequest` carries exactly one `returnUrl`, no separate cancel URL.
- `src/lib/payment/mockPaymentProvider.ts` — the reference shape: a session record, a decision,
  `confirmPayment` answers from that record.
- `src/lib/payment/orderPayment.ts` — `markOrderPaid`/`markOrderPaymentUnsuccessful`, idempotent via
  `PaymentEvents.providerEventId`'s UNIQUE constraint, not a read-then-write.
- `src/lib/payment/settleOrderPayment.ts` — what runs when the customer's browser returns; asks the
  provider, never trusts the visit itself.
- `src/lib/placeOrder.ts` — creates the order (`pending`), calls `provider.createPayment`, stores
  `providerRef`, redirects to `payment.redirectUrl`. The only webhook-shaped gap: there is currently
  no webhook route in the app at all — this task adds the first one.
- **The brief's own `validateIntegerAmount.ts` reference is stale.** That file was deleted in
  commit `001a113` ("fix(money): store amounts in major units, not agorot/cents") — a concurrent
  change from the session before this one — and replaced by `src/lib/validateMoneyAmount.ts` /
  `src/lib/price.ts`'s `roundMoney`. Money is now major units (e.g. `55.50`, not `5550`), validated
  to at most two decimal places. This task uses `validateMoneyAmount`/`roundMoney`, not a file that
  no longer exists. Said plainly here rather than worked around silently.
- `docs/DECISIONS.md` §8/§10/§14: hosted payment page only, card details never touch this domain;
  PayPal first because it already works for the institute today; adapter is "structured extension
  work," first real test of that claim in this task.

## Scope

- Sandbox credentials only. Never configure, request, or touch live PayPal credentials.
- `APP_ENV` stays `demo`. Not touched.
- Mock provider stays exactly as it is — the test suite and the demo depend on it.

## Design, decided before writing code

- **PayPal Orders API v2, intent `CAPTURE`, hosted approval page.** `createPayment` creates the
  order and returns the `approve` link as `redirectUrl`, the PayPal order id as `providerRef`.
- **The single-`returnUrl` interface doesn't map cleanly onto PayPal's separate approve/cancel
  URLs** — a real gap between the existing interface and a real gateway, worth reporting per the
  brief's own ask. Resolved by pointing both PayPal's `return_url` and `cancel_url` at the same
  `request.returnUrl`: `confirmPayment` asks the provider what actually happened rather than
  inferring it from which URL the browser landed on, which is exactly what the interface's own
  doc comment already requires ("never taken from the customer's browser"). Reported as a finding,
  not silently patched into the interface.
- **`confirmPayment` performs the capture** if the order is `APPROVED` and not yet captured (the
  synchronous path, for a customer who returns to the site) and also reads an already-completed
  capture if one exists (the asynchronous path, when the webhook or a previous visit already
  settled it). A `CREATED` order with no capture is a genuine cancel (customer never approved) —
  reported with a deterministic synthetic event id (`paypal-cancel-<providerRef>`), since PayPal
  issues no event for a plain cancel.
- **Webhook route is new**: verifies every request via PayPal's `verify-webhook-signature` API
  (not hand-rolled RSA verification — "small and boring", and PayPal's own recommended method),
  then calls the exact same `markOrderPaid`/`markOrderPaymentUnsuccessful` functions
  `settleOrderPayment` uses, keyed on the capture's own id as `providerEventId` — so whichever path
  (browser return or webhook) arrives first wins, and the other is a no-op through the existing
  UNIQUE constraint. No parallel settlement path.
- **Env**: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV`
  (`sandbox` | `live`) — required together when `PAYMENT_PROVIDER=paypal`, mirroring
  `googleSignIn.ts`'s all-or-none pattern. Only `sandbox` is ever exercised in this task.

## The gate itself

Exercise, against the real PayPal sandbox, and report each outcome honestly:

1. a complete successful purchase, cart through to a paid order;
2. a cancelled payment;
3. a declined payment;
4. a duplicate webhook delivery, proving idempotency;
5. a tampered webhook, proving signature verification rejects it.

At least one of (1) in ILS, one in a second currency. Report what the integration was actually
like to build — friction, surprises, anything that would make the Israeli gateway harder than §8
assumes.

## Gate and reporting

`tsc --noEmit`, ESLint, Vitest, `next build` before every commit. Small conventional commits. No
live credentials in any file, doc, report, or commit message. Cannot push.

If the sandbox exercises need something only Emanuel can provide or approve (a PayPal developer
account, sandbox app credentials, a reachable webhook URL), that is said plainly and asked for
rather than worked around or faked.
