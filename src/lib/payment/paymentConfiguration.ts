import { readAppEnvironment } from '@/lib/appEnvironment'
import { requireEnv } from '@/lib/env'

import type { AppEnvironment } from '@/lib/appEnvironment'

export const MOCK_PAYMENT_PROVIDER_NAME = 'mock'

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

/** The configured provider's name, after checking it is safe to run here. */
export function readPaymentProviderName(): string {
  const providerName = requireEnv('PAYMENT_PROVIDER')
  assertProviderAllowedInEnvironment(providerName, readAppEnvironment())
  return providerName
}
