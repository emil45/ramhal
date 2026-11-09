import { roundMoney } from '@/lib/shop/price'

import type { GrowConfig, GrowVatType } from '@/lib/payment/growConfig'
import type { GrowPayer } from '@/lib/payment/growPayer'
import type { PaymentConfirmation, PaymentRequest } from '@/lib/payment/paymentProvider'

/**
 * The two messages this site exchanges with the Make scenarios, and how Grow's
 * own state is read out of them. The contract is written down for whoever
 * builds the scenarios in docs/grow-make-scenarios.md; nothing outside this
 * file and growProvider.ts knows its shape.
 */

export type GrowCreatePaymentBody = {
  orderNumber: number
  /** The page title Grow shows the customer. */
  title: string
  /** Shekels, as the customer is charged. */
  amount: number
  vatType: GrowVatType
  payer: GrowPayer
  successUrl: string
}

export type GrowPaymentLink = { processId: string; processToken: string; paymentUrl: string }

export type GrowPaymentStatus = { statusCode: string; transactionId: string | null }

// Grow's API rejects special characters in any parameter, so the title
// carries no quotation marks or punctuation, which the institute's name
// would otherwise bring.
const PAYMENT_TITLE_PREFIX = 'הזמנה מספר'
const INSTITUTE_NAME_FOR_PAYMENT_TITLE = 'מכון רמחל'

export function buildGrowCreatePaymentBody(request: PaymentRequest, payer: GrowPayer, config: GrowConfig): GrowCreatePaymentBody {
  return {
    orderNumber: request.orderNumber,
    title: `${PAYMENT_TITLE_PREFIX} ${request.orderNumber} ${INSTITUTE_NAME_FOR_PAYMENT_TITLE}`,
    amount: roundMoney(request.total),
    vatType: config.vatType,
    payer,
    successUrl: new URL(request.returnUrl, config.siteUrl).toString(),
  }
}

// Grow identifies a payment link by two values, and its status can only be
// asked for with both; the order stores a single reference, so they travel
// together. A colon cannot appear in either: both are numbers or hex digests.
const REFERENCE_SEPARATOR = ':'

export function encodeGrowReference(link: Pick<GrowPaymentLink, 'processId' | 'processToken'>): string {
  return `${link.processId}${REFERENCE_SEPARATOR}${link.processToken}`
}

export function decodeGrowReference(reference: string): { processId: string; processToken: string } {
  const [processId, processToken, ...rest] = reference.split(REFERENCE_SEPARATOR)
  if (!processId || !processToken || rest.length > 0) throw new Error(`"${reference}" is not a Grow payment reference.`)
  return { processId, processToken }
}

/** What Make's "create payment link" scenario answers with. */
export function parseGrowPaymentLink(body: unknown): GrowPaymentLink {
  const processId = readText(body, 'processId')
  const processToken = readText(body, 'processToken')
  const paymentUrl = readText(body, 'paymentUrl')
  if (!processId || !processToken || !paymentUrl) {
    throw new Error('Grow payment link response lacks processId, processToken or paymentUrl.')
  }
  return { processId, processToken, paymentUrl }
}

/** What Make's notification scenario posts here once Grow reports a payment:
 * only which payment link it concerns. What happened to it is asked of Grow
 * again, never taken from this call. */
export function parseGrowPaymentNotification(body: unknown): string {
  const processId = readText(body, 'processId')
  const processToken = readText(body, 'processToken')
  if (!processId || !processToken) throw new Error('Grow notification lacks processId or processToken.')
  return encodeGrowReference({ processId, processToken })
}

/** What Make's "payment status" scenario answers with. */
export function parseGrowPaymentStatus(body: unknown): GrowPaymentStatus {
  const statusCode = readText(body, 'statusCode')
  if (!statusCode) throw new Error('Grow payment status response lacks statusCode.')
  return { statusCode, transactionId: readText(body, 'transactionId') }
}

// Grow's status codes (developers.grow.business, "Parameter Mapping").
const STATUS_NOT_PAID = '0'
const STATUS_PAID = '2'
const STATUS_CANCELLED_BEFORE_TRANSMISSION = '4'
const STATUS_DENIED = '9'
// A refund is something that happens to a payment that was already taken,
// not an outcome of taking it, and an order Grow has paid is never settled again.
const REFUND_STATUS_CODES = ['3', '6']

/**
 * What Grow's status means for the order. A paid payment always has a
 * transaction, and its id is the idempotency key. A denied or cancelled one
 * may not, so its key is derived from the reference: asking again must hit
 * the same PaymentEvents row, not insert a new one.
 */
export function confirmationFromGrowStatus(providerRef: string, status: GrowPaymentStatus): PaymentConfirmation {
  const { statusCode, transactionId } = status

  if (statusCode === STATUS_PAID) {
    if (!transactionId) throw new Error(`Grow reports payment ${providerRef} as paid without a transaction id.`)
    return { status: 'paid', providerEventId: `grow-${transactionId}` }
  }
  if (statusCode === STATUS_DENIED) return { status: 'failed', providerEventId: `grow-denied-${transactionId ?? providerRef}` }
  if (statusCode === STATUS_CANCELLED_BEFORE_TRANSMISSION) {
    return { status: 'cancelled', providerEventId: `grow-cancelled-${transactionId ?? providerRef}` }
  }
  if (statusCode === STATUS_NOT_PAID || REFUND_STATUS_CODES.includes(statusCode)) return { status: 'pending' }

  throw new Error(`Grow reported an unknown status code "${statusCode}" for payment ${providerRef}.`)
}

/** Make renders identifiers as numbers or strings depending on the module. */
function readText(source: unknown, key: string): string | null {
  if (typeof source !== 'object' || source === null) return null
  const value: unknown = Reflect.get(source, key)
  if (typeof value === 'string' && value !== '') return value
  if (typeof value === 'number') return String(value)
  return null
}
