import 'server-only'

import config from '@payload-config'
import { randomUUID } from 'node:crypto'
import { getPayload } from 'payload'

import { localePath } from '@/lib/routes'

import type { MockPaymentSession } from '@/payload-types'
import type { MockPaymentDecision } from '@/lib/payment/mockPaymentDecision'
import type { PaymentConfirmation, PaymentCreation, PaymentProvider, PaymentRequest } from '@/lib/payment/paymentProvider'

export const MOCK_PAYMENT_PATH_SEGMENT = 'mock-payment'

/**
 * A stand-in for an off-site, asynchronously-confirming processor, for demos.
 * It behaves like one where it matters: it keeps its own record of what the
 * customer decided (MockPaymentSessions), and `confirmPayment` answers from
 * that record — never from anything the customer's browser reports. It does
 * NOT take money, and the application refuses to start in production with it
 * configured (src/lib/payment/paymentConfiguration.ts).
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock'

  async createPayment(request: PaymentRequest): Promise<PaymentCreation> {
    const payload = await getPayload({ config })
    const providerRef = randomUUID()

    await payload.create({
      collection: 'mockPaymentSessions',
      data: {
        providerRef,
        orderNumber: request.orderNumber,
        currency: request.currency,
        total: request.total,
        locale: request.locale,
        returnUrl: request.returnUrl,
        decision: 'awaiting',
      },
    })

    return { providerRef, redirectUrl: localePath(request.locale, `/${MOCK_PAYMENT_PATH_SEGMENT}/${providerRef}`) }
  }

  async confirmPayment(providerRef: string): Promise<PaymentConfirmation> {
    const session = await findMockPaymentSession(providerRef)
    if (!session) throw new Error(`The mock payment provider has no payment "${providerRef}".`)

    switch (session.decision) {
      case 'awaiting':
        return { status: 'pending' }
      case 'paid':
        return { status: 'paid', providerEventId: requireEventId(session) }
      case 'declined':
        return { status: 'failed', providerEventId: requireEventId(session) }
      case 'cancelled':
        return { status: 'cancelled', providerEventId: requireEventId(session) }
    }
  }
}

function requireEventId(session: MockPaymentSession): string {
  if (!session.providerEventId) {
    throw new Error(`Mock payment "${session.providerRef}" was decided but has no event id.`)
  }
  return session.providerEventId
}

export async function findMockPaymentSession(providerRef: string): Promise<MockPaymentSession | null> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'mockPaymentSessions',
    where: { providerRef: { equals: providerRef } },
    limit: 1,
  })
  return result.docs[0] ?? null
}

/**
 * The customer's click on the mock payment page. A payment is decided once:
 * a second click (or a replayed request) changes nothing, the way a real
 * processor's page cannot be paid twice. The event id is minted here, at
 * decision time, and is the same every time `confirmPayment` is asked.
 */
export async function decideMockPayment(providerRef: string, decision: MockPaymentDecision): Promise<MockPaymentSession> {
  const payload = await getPayload({ config })
  const session = await findMockPaymentSession(providerRef)
  if (!session) throw new Error(`The mock payment provider has no payment "${providerRef}".`)
  if (session.decision !== 'awaiting') return session

  return payload.update({
    collection: 'mockPaymentSessions',
    id: session.id,
    data: { decision, providerEventId: `mock_evt_${randomUUID()}` },
  })
}
