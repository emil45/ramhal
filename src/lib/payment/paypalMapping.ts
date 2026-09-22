import { roundMoney } from '@/lib/price'

import type { Currency } from '@/lib/currency'
import type { PaymentConfirmation } from '@/lib/payment/paymentProvider'

/**
 * PayPal's Orders API takes an amount as `{ currency_code, value }`, `value`
 * a decimal string — never a float, which is how a currency ends up sent as
 * `55.00000000000001`. ILS/EUR/USD are all two-decimal currencies for
 * PayPal (unlike zero-decimal JPY/HUF or three-decimal ones), so `.toFixed(2)`
 * is correct here; a fourth currency would need this revisited.
 */
export function toPayPalAmount(currency: Currency, amount: number): { currency_code: Currency; value: string } {
  return { currency_code: currency, value: roundMoney(amount).toFixed(2) }
}

/** `he-IL` → `he_IL`: Intl's BCP-47 tag (src/lib/locale.ts) with PayPal's
 * underscore separator. */
export function toPayPalLocale(intlTag: string): string {
  return intlTag.replace('-', '_')
}

export type PayPalCapture = { id: string; status: string }

/**
 * What a capture attempt (or an already-captured order) means for our own
 * PaymentConfirmation. COMPLETED and DECLINED are the two outcomes CAPTURE
 * intent actually reaches synchronously; anything else (PENDING and the
 * post-capture refund states, which cannot happen here) is reported as
 * still-pending rather than guessed at.
 */
export function confirmationFromCapture(capture: PayPalCapture): PaymentConfirmation {
  if (capture.status === 'COMPLETED') return { status: 'paid', providerEventId: capture.id }
  if (capture.status === 'DECLINED') return { status: 'failed', providerEventId: capture.id }
  return { status: 'pending' }
}

/**
 * A PayPal order that is still `CREATED` — the customer never approved it —
 * is a genuine cancel, but PayPal issues no event for that (nothing
 * happened on its side worth notifying about). The event id is synthesised
 * deterministically from the order id rather than minted fresh each call, so
 * repeated confirmPayment calls (a reloaded return page) hit the same
 * PaymentEvents row instead of trying to insert a new one each time.
 */
export function cancelledConfirmation(providerRef: string): PaymentConfirmation {
  return { status: 'cancelled', providerEventId: `paypal-cancel-${providerRef}` }
}

/**
 * A capture PayPal refused outright (HTTP error, not a COMPLETED/DECLINED
 * capture object) — sandbox negative testing exercises this path
 * (docs/reports/TASK-26.md). No capture id exists to use as an event id, so
 * one is synthesised the same deterministic way cancelledConfirmation's is.
 */
export function declinedConfirmation(providerRef: string): PaymentConfirmation {
  return { status: 'failed', providerEventId: `paypal-decline-${providerRef}` }
}

const CAPTURE_COMPLETED_EVENT = 'PAYMENT.CAPTURE.COMPLETED'
const CAPTURE_DECLINED_EVENT = 'PAYMENT.CAPTURE.DENIED'

export type PayPalWebhookVerdict = 'failed' | 'paid'

/** The two capture webhook events this adapter acts on. Every other event
 * type (order approved, refunds, disputes, …) is acknowledged but ignored —
 * settlement only ever happens through a capture outcome. */
export function verdictForEventType(eventType: string): PayPalWebhookVerdict | null {
  if (eventType === CAPTURE_COMPLETED_EVENT) return 'paid'
  if (eventType === CAPTURE_DECLINED_EVENT) return 'failed'
  return null
}

export type PayPalCaptureWebhookEvent = {
  event_type?: string
  resource?: {
    id?: string
    supplementary_data?: { related_ids?: { order_id?: string } }
  }
}

/** The capture's own id — used as providerEventId, the same real PayPal id
 * whether it arrives here or through the synchronous capture-on-return path,
 * so whichever settles the order first makes the other a no-op. */
export function captureIdFromEvent(event: PayPalCaptureWebhookEvent): string | null {
  return event.resource?.id ?? null
}

/** The PayPal order id (our own providerRef) a capture webhook belongs to —
 * carried in supplementary_data, since the capture id itself is not the
 * order id. */
export function orderIdFromCaptureEvent(event: PayPalCaptureWebhookEvent): string | null {
  return event.resource?.supplementary_data?.related_ids?.order_id ?? null
}
