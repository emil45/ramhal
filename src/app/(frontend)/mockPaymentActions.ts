'use server'

import { notFound } from 'next/navigation'

import { isMockPaymentProviderConfigured } from '@/lib/payment/getPaymentProvider'
import { decideMockPayment } from '@/lib/payment/mockPaymentProvider'
import { isMockPaymentDecision } from '@/lib/payment/mockPaymentDecision'

/**
 * The customer's choice on the mock payment page. Returns where to send the
 * browser next rather than redirecting: a Server Action redirect is a
 * client-side navigation, and a real processor sends the customer home with a
 * full page load (MockPaymentChoices does the same). The choice is recorded
 * on the mock's own side; the site still learns the outcome only by asking
 * `confirmPayment`. Inert unless the mock is the configured provider.
 */
export async function chooseMockPaymentOutcome(providerRef: string, decision: string): Promise<{ returnUrl: string }> {
  if (!isMockPaymentProviderConfigured()) notFound()
  if (!isMockPaymentDecision(decision)) throw new Error(`Unknown mock payment decision "${decision}".`)

  const session = await decideMockPayment(providerRef, decision)
  return { returnUrl: session.returnUrl }
}
