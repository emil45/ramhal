# Grow through Make: the three scenarios

Israeli shekel orders are paid on Grow's page. This site does not hold a Grow
API key; it talks to three Make scenarios, and Make holds the Grow connection.
The site's side is `src/lib/payment/growProvider.ts`, the message shapes are in
`src/lib/payment/growMapping.ts`, and the callback is
`src/app/(payload)/api/webhooks/grow/route.ts`.

Every call in either direction carries the header `x-ramhal-webhook-secret`
with the same value as the site's `GROW_WEBHOOK_SECRET`. A Make scenario that
answers a call from the site needs no check of its own beyond being private;
the scenario that calls the site must send the header.

Build the scenarios on a **Grow Sandbox** connection first (connection type
"Grow Sandbox", account number is the ID or company number linked to the Grow
account, then the SMS code). Sandbox accepts test cards such as
`4580458045804580`; Bit, Apple Pay, Google Pay and PayBox can charge real money
even there. Switch to production by selecting a connection of type "Grow".

## 1. Create payment link (site calls Make)

Trigger: **Webhooks → Custom webhook** (copy its address into
`GROW_CREATE_PAYMENT_URL`). The site POSTs JSON:

| Field | Meaning |
| --- | --- |
| `orderNumber` | The order's number, number |
| `title` | Page title for the customer, text without punctuation |
| `amount` | Shekels, number with up to two decimals |
| `vatType` | `regular` or `exempt`: map to Grow's "regular VAT" / "VAT exempt" |
| `payer.fullName`, `payer.phone`, `payer.email` | Already normalised: two names, phone as `0501234567` |
| `successUrl` | Where Grow sends the customer after paying |

Then **Grow → Create Payment Link** with Sending Mode `none`:

- Notify URL: the address of scenario 3's webhook (Grow calls it on every payment change).
- Success URL: `successUrl`. Title: `title`. Full name, phone, email from `payer`.
- Charge type: regular. Payment type: payments, one payment.
- One product: name `title`, price `amount`, quantity 1, VAT per `vatType`.
- Custom field 1: `orderNumber`, to find the payment in Grow's panel.

Finish with **Webhooks → Webhook response**, status 200, JSON body:

```json
{ "processId": "<Payment Link Process ID>", "processToken": "<Payment Link Process Token>", "paymentUrl": "<URL>" }
```

## 2. Payment status (site calls Make)

Trigger: **Custom webhook** (`GROW_PAYMENT_STATUS_URL`). The site POSTs
`{ "processId": "...", "processToken": "..." }`.

Look the payment link up (**Grow → Get Payment Link Info**, or **Make an API
Call** to `getPaymentProcessInfo` if the former does not return transactions)
and answer with a **Webhook response**:

```json
{ "statusCode": "2", "transactionId": "421100" }
```

`statusCode` is Grow's own (`2` paid, `0` not paid, `4` cancelled before
transmission, `9` denied; refunds `3`, `6`). When the link has several
transactions, answer with the paid one if there is one, otherwise the latest.
`transactionId` may be left out when there is none. The site treats any other
code as an error, deliberately.

## 3. Payment notification (Grow calls Make, Make calls the site)

Trigger: **Grow → Notify URL Webhook** (its address goes into scenario 1's
Notify URL). Then, in this order:

1. **HTTP → Make a request**: POST to `https://<site>/api/webhooks/grow` with
   the secret header and body
   `{ "processId": "<paymentLinkProcessId>", "processToken": "<paymentLinkProcessToken>" }`
   from Grow's callback. Enable "Evaluate all states as errors".
2. Only when step 1 returned 2xx: **Grow → Approve Transaction** with the
   callback's transaction id and token.

Approving only after the site has answered means a failed call leaves the
notification unapproved, so Grow repeats it after about 10, 20 and 30 minutes.

## Site configuration

`PAYMENT_PROVIDER=grow,paypal`, plus `GROW_CREATE_PAYMENT_URL`,
`GROW_PAYMENT_STATUS_URL`, `GROW_WEBHOOK_SECRET` and `GROW_VAT_TYPE`
(see `.env.example`). All four Grow variables are required together.
