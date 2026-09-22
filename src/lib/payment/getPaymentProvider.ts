import 'server-only'

import { MOCK_PAYMENT_PROVIDER_NAME, readPaymentProviderName } from '@/lib/payment/paymentConfiguration'
import { MockPaymentProvider } from '@/lib/payment/mockPaymentProvider'
import { readPayPalConfig } from '@/lib/payment/paypalConfig'
import { PayPalProvider } from '@/lib/payment/paypalProvider'

import type { PaymentProvider } from '@/lib/payment/paymentProvider'

export const PAYPAL_PAYMENT_PROVIDER_NAME = 'paypal'

/** The configured payment provider. A new provider is a new adapter
 * implementing PaymentProvider and one more branch here. */
export function getPaymentProvider(): PaymentProvider {
  const providerName = readPaymentProviderName()

  if (providerName === MOCK_PAYMENT_PROVIDER_NAME) return new MockPaymentProvider()
  if (providerName === PAYPAL_PAYMENT_PROVIDER_NAME) return new PayPalProvider(readPayPalConfig(process.env))

  throw new Error(`PAYMENT_PROVIDER "${providerName}" is not a known payment provider.`)
}

export function isMockPaymentProviderConfigured(): boolean {
  return readPaymentProviderName() === MOCK_PAYMENT_PROVIDER_NAME
}
