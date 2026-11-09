import 'server-only'

import { postToGrowGateway } from '@/lib/payment/growClient'
import {
  buildGrowCreatePaymentBody,
  confirmationFromGrowStatus,
  decodeGrowReference,
  encodeGrowReference,
  parseGrowPaymentLink,
  parseGrowPaymentStatus,
} from '@/lib/payment/growMapping'
import { toGrowPayer } from '@/lib/payment/growPayer'
import { GROW_PAYMENT_PROVIDER_NAME } from '@/lib/payment/paymentConfiguration'

import type { GrowConfig } from '@/lib/payment/growConfig'
import type { PaymentConfirmation, PaymentCreation, PaymentProvider, PaymentRequest } from '@/lib/payment/paymentProvider'

export class GrowProvider implements PaymentProvider {
  readonly name = GROW_PAYMENT_PROVIDER_NAME

  constructor(private readonly config: GrowConfig) {}

  async createPayment(request: PaymentRequest): Promise<PaymentCreation> {
    // choosePaymentProviderName never routes such an order here; these guards
    // keep a caller that skipped it from charging in the wrong currency or
    // sending Grow a payer it will refuse.
    if (request.currency !== 'ILS') throw new Error(`Grow takes shekels only; order ${request.orderNumber} is in ${request.currency}.`)
    const payer = toGrowPayer(request.payer)
    if (!payer) throw new Error(`Grow cannot take the payer of order ${request.orderNumber}: it needs a full name and an Israeli mobile number.`)

    const response = await postToGrowGateway(this.config, this.config.createPaymentUrl, buildGrowCreatePaymentBody(request, payer, this.config))
    const link = parseGrowPaymentLink(response)

    return { providerRef: encodeGrowReference(link), redirectUrl: link.paymentUrl }
  }

  async confirmPayment(providerRef: string): Promise<PaymentConfirmation> {
    const response = await postToGrowGateway(this.config, this.config.paymentStatusUrl, decodeGrowReference(providerRef))
    return confirmationFromGrowStatus(providerRef, parseGrowPaymentStatus(response))
  }
}
