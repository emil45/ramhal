import { notFound, redirect } from 'next/navigation'

import { isLocale } from '@/lib/locale/locale'
import { settleOrderPayment } from '@/lib/payment/settleOrderPayment'
import { localePath } from '@/lib/locale/routes'
import { clearCart } from '@/lib/shop/serverCart'

/**
 * Where the payment provider sends the customer's browser back to. Being
 * here proves nothing about payment: settleOrderPayment asks the provider
 * what happened. Only a paid order empties the cart — after a decline or a
 * cancel the customer's books are still waiting for them.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params
  if (!isLocale(locale)) notFound()

  const order = await settleOrderPayment(token)
  if (!order) notFound()

  if (order.paymentStatus === 'paid') await clearCart()

  redirect(localePath(locale, `/order/${token}`))
}
