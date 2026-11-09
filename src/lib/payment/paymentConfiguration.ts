import { readAppEnvironment } from '@/lib/platform/appEnvironment'
import { requireEnv } from '@/lib/platform/env'

import type { AppEnvironment } from '@/lib/platform/appEnvironment'

export const MOCK_PAYMENT_PROVIDER_NAME = 'mock'
export const PAYPAL_PAYMENT_PROVIDER_NAME = 'paypal'
export const GROW_PAYMENT_PROVIDER_NAME = 'grow'

export const PAYMENT_PROVIDER_NAMES = [MOCK_PAYMENT_PROVIDER_NAME, PAYPAL_PAYMENT_PROVIDER_NAME, GROW_PAYMENT_PROVIDER_NAME] as const

export type PaymentProviderName = (typeof PAYMENT_PROVIDER_NAMES)[number]

export function isPaymentProviderName(value: string): value is PaymentProviderName {
  return (PAYMENT_PROVIDER_NAMES as readonly string[]).includes(value)
}

/**
 * A mock payment provider reaching production is a shop that gives books
 * away, so this is a hard failure at startup — not a warning, not a log line.
 */
export function assertProviderAllowedInEnvironment(providerName: string, appEnvironment: AppEnvironment): void {
  if (appEnvironment === 'production' && providerName === MOCK_PAYMENT_PROVIDER_NAME) {
    throw new Error(
      `Refusing to start: PAYMENT_PROVIDER is "${MOCK_PAYMENT_PROVIDER_NAME}" while APP_ENV is "production". ` +
        'The mock provider marks orders as paid without any real payment, so it must never serve production. ' +
        'Set PAYMENT_PROVIDER to a real provider.',
    )
  }
}

/**
 * `PAYMENT_PROVIDER` is a comma-separated list because one shop can take
 * payment through several providers at once (Grow for shekels in Israel,
 * PayPal for everyone else). The mock stands in for all of them, so mixing it
 * with a real provider would silently send some real customers to a page that
 * takes no money.
 */
export function parsePaymentProviderNames(value: string): PaymentProviderName[] {
  const names = value
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '')

  for (const name of names) {
    if (!isPaymentProviderName(name)) {
      throw new Error(`PAYMENT_PROVIDER "${name}" is not a known payment provider. Known: ${PAYMENT_PROVIDER_NAMES.join(', ')}.`)
    }
  }

  const providers = names.filter(isPaymentProviderName)
  if (providers.length === 0) throw new Error('PAYMENT_PROVIDER names no payment provider. See .env.example.')
  if (providers.includes(MOCK_PAYMENT_PROVIDER_NAME) && providers.length > 1) {
    throw new Error(`PAYMENT_PROVIDER "${MOCK_PAYMENT_PROVIDER_NAME}" cannot be combined with another provider.`)
  }
  return providers
}

/** The configured providers' names, after checking each is safe to run here. */
export function readPaymentProviderNames(): PaymentProviderName[] {
  const providers = parsePaymentProviderNames(requireEnv('PAYMENT_PROVIDER'))
  const appEnvironment = readAppEnvironment()
  for (const provider of providers) assertProviderAllowedInEnvironment(provider, appEnvironment)
  return providers
}
