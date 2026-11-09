import 'server-only'

import { readGrowConfig } from '@/lib/payment/growConfig'
import { GrowProvider } from '@/lib/payment/growProvider'
import {
  GROW_PAYMENT_PROVIDER_NAME,
  isPaymentProviderName,
  MOCK_PAYMENT_PROVIDER_NAME,
  PAYPAL_PAYMENT_PROVIDER_NAME,
  readPaymentProviderNames,
} from '@/lib/payment/paymentConfiguration'
import { MockPaymentProvider } from '@/lib/payment/mockPaymentProvider'
import { readPayPalConfig } from '@/lib/payment/paypalConfig'
import { PayPalProvider } from '@/lib/payment/paypalProvider'

import type { PaymentProvider } from '@/lib/payment/paymentProvider'

/** The adapter for one provider. A new provider is a new adapter
 * implementing PaymentProvider and one more branch here. */
export function getPaymentProvider(providerName: string): PaymentProvider {
  if (!isPaymentProviderName(providerName)) throw new Error(`"${providerName}" is not a known payment provider.`)

  if (providerName === MOCK_PAYMENT_PROVIDER_NAME) return new MockPaymentProvider()
  if (providerName === PAYPAL_PAYMENT_PROVIDER_NAME) return new PayPalProvider(readPayPalConfig(process.env))
  if (providerName === GROW_PAYMENT_PROVIDER_NAME) return new GrowProvider(readGrowConfig(process.env))

  throw new Error(`No adapter for payment provider "${providerName}".`)
}

export function isMockPaymentProviderConfigured(): boolean {
  return readPaymentProviderNames().includes(MOCK_PAYMENT_PROVIDER_NAME)
}
