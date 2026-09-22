import 'server-only'

import { LOCALE_CONFIG } from '@/lib/locale'
import { captureOrder, getAccessToken, getOrder, PayPalApiError, createOrder as sendCreateOrder } from '@/lib/payment/paypalClient'
import { cancelledConfirmation, confirmationFromCapture, declinedConfirmation, toPayPalAmount, toPayPalLocale } from '@/lib/payment/paypalMapping'

import type { PayPalConfig } from '@/lib/payment/paypalConfig'
import type { PayPalOrder } from '@/lib/payment/paypalClient'
import type { PaymentConfirmation, PaymentCreation, PaymentProvider, PaymentRequest } from '@/lib/payment/paymentProvider'

const APPROVE_LINK_REL = 'approve'

export class PayPalProvider implements PaymentProvider {
  readonly name = 'paypal'

  constructor(private readonly config: PayPalConfig) {}

  async createPayment(request: PaymentRequest): Promise<PaymentCreation> {
    const accessToken = await getAccessToken(this.config)
    const order = await sendCreateOrder(this.config, accessToken, {
      amount: toPayPalAmount(request.currency, request.total),
      returnUrl: request.returnUrl,
      locale: toPayPalLocale(LOCALE_CONFIG[request.locale].intlTag),
    })

    const approveLink = order.links.find((link) => link.rel === APPROVE_LINK_REL)
    if (!approveLink) throw new Error(`PayPal order ${order.id} has no "${APPROVE_LINK_REL}" link.`)

    return { providerRef: order.id, redirectUrl: approveLink.href }
  }

  async confirmPayment(providerRef: string): Promise<PaymentConfirmation> {
    const accessToken = await getAccessToken(this.config)
    const order = await getOrder(this.config, accessToken, providerRef)

    const existingCapture = latestCapture(order)
    if (existingCapture) return confirmationFromCapture(existingCapture)

    if (order.status === 'APPROVED') {
      try {
        const captured = await captureOrder(this.config, accessToken, providerRef)
        const capture = latestCapture(captured)
        if (capture) return confirmationFromCapture(capture)
        return { status: 'pending' }
      } catch (error) {
        if (error instanceof PayPalApiError) return declinedConfirmation(providerRef)
        throw error
      }
    }

    // confirmPayment is only ever reached once the customer's browser has
    // already returned to our site (settleOrderPayment is what calls it,
    // and that only runs from the return route) — so a still-CREATED order
    // at this point cannot mean "still deciding on PayPal's page," it can
    // only mean they clicked "Cancel and return" without approving.
    if (order.status === 'CREATED') return cancelledConfirmation(providerRef)

    return { status: 'pending' }
  }
}

function latestCapture(order: PayPalOrder): { id: string; status: string } | null {
  const captures = order.purchase_units?.[0]?.payments?.captures
  if (!captures || captures.length === 0) return null
  return captures[captures.length - 1]
}
