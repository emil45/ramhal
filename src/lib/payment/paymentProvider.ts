import type { Currency } from '@/lib/currency'
import type { Locale } from '@/lib/locale'

/**
 * Everything a payment provider needs to know about an order. A real provider
 * adapter turns `returnUrl` (a path on this site) into an absolute URL with
 * its own configured site address — the interface stays provider-neutral.
 */
export type PaymentRequest = {
  orderNumber: number
  currency: Currency
  /** Minor units (agorot/cents). */
  total: number
  /** Language to present the provider's payment page in. */
  locale: Locale
  /** Where the customer's browser lands after the provider's page. Landing
   * here is NOT proof of payment — only `confirmPayment` is. */
  returnUrl: string
}

export type PaymentCreation = {
  /** The provider's own identifier for this payment. */
  providerRef: string
  /** Off-site (or, for the mock, look-alike) page the customer is sent to. */
  redirectUrl: string
}

/**
 * `pending` means the provider has no final answer yet — a normal state for a
 * provider that confirms asynchronously. Every final answer carries the
 * provider's own event id, which is what makes handling it idempotent: every
 * real provider retries its confirmations.
 */
export type PaymentConfirmation =
  | { status: 'pending' }
  | { status: 'paid' | 'failed' | 'cancelled'; providerEventId: string }

/** The seam a real payment provider plugs into: one adapter implementing
 * this, and nothing else in the codebase changes. */
export interface PaymentProvider {
  readonly name: string
  createPayment(request: PaymentRequest): Promise<PaymentCreation>
  /** Server-side check of what actually happened, asked of the provider
   * itself — never taken from the customer's browser. */
  confirmPayment(providerRef: string): Promise<PaymentConfirmation>
}
