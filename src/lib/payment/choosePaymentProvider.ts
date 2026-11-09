import { toGrowPayer } from '@/lib/payment/growPayer'
import {
  GROW_PAYMENT_PROVIDER_NAME,
  MOCK_PAYMENT_PROVIDER_NAME,
  PAYPAL_PAYMENT_PROVIDER_NAME,
} from '@/lib/payment/paymentConfiguration'

import type { PaymentProviderName } from '@/lib/payment/paymentConfiguration'
import type { PaymentRequest } from '@/lib/payment/paymentProvider'
import type { Currency } from '@/lib/shop/currency'

export type PaymentChoiceInput = {
  currency: Currency
  destinationCountry: string
  payer: PaymentRequest['payer']
}

const ISRAEL_COUNTRY_CODE = 'IL'

/**
 * Grow settles shekels only and its payment page needs a full name and an
 * Israeli mobile number, so it can serve an order that is in shekels, goes to
 * Israel and whose payer typed both. Anyone else would reach a page that
 * cannot take their payment.
 */
function growCanTake(order: PaymentChoiceInput): boolean {
  return order.currency === 'ILS' && order.destinationCountry === ISRAEL_COUNTRY_CODE && toGrowPayer(order.payer) !== null
}

/**
 * Which of the enabled providers takes this order. Grow is preferred where it
 * can serve the order; PayPal takes everything else. The mock is only ever
 * enabled alone, in which case it takes every order.
 */
export function choosePaymentProviderName(enabled: readonly PaymentProviderName[], order: PaymentChoiceInput): PaymentProviderName {
  if (enabled.includes(MOCK_PAYMENT_PROVIDER_NAME)) return MOCK_PAYMENT_PROVIDER_NAME
  if (enabled.includes(GROW_PAYMENT_PROVIDER_NAME) && growCanTake(order)) return GROW_PAYMENT_PROVIDER_NAME
  if (enabled.includes(PAYPAL_PAYMENT_PROVIDER_NAME)) return PAYPAL_PAYMENT_PROVIDER_NAME

  throw new Error(
    `No enabled payment provider (${enabled.join(', ')}) can take a ${order.currency} order to ${order.destinationCountry}.`,
  )
}
