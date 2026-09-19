import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getDictionary } from '@/app/(frontend)/dictionary'
import { MockPaymentNotice } from '@/components/storefront/MockPaymentNotice'
import { isLocale } from '@/lib/locale'
import { MOCK_PAYMENT_PROVIDER_NAME } from '@/lib/payment/paymentConfiguration'
import { findOrderByPublicToken } from '@/lib/payment/settleOrderPayment'
import { formatPrice } from '@/lib/price'
import { cataloguePath, localePath } from '@/lib/routes'

// Reflects the order's live payment state — never cacheable.
export const dynamic = 'force-dynamic'

const linkButton = 'rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-deep'
const secondaryLink = 'text-sm text-teal underline-offset-4 hover:underline'

/**
 * What the customer sees after the payment page, decided by the order's own
 * recorded state — not by anything in the URL beyond which order it is.
 */
export default async function OrderPage({ params }: PageProps<'/[locale]/order/[token]'>) {
  const { locale, token } = await params
  if (!isLocale(locale)) notFound()

  const order = await findOrderByPublicToken(token)
  if (!order) notFound()

  const dict = getDictionary(locale)
  const { order: text } = dict
  const cartLink = localePath(locale, '/cart')
  const money = (amount: number) => formatPrice(amount, order.currency, locale)

  const outcome = {
    paid: { title: text.confirmedTitle, body: text.confirmedIntro },
    failed: { title: text.declinedTitle, body: text.declinedBody },
    cancelled: { title: text.cancelledTitle, body: text.cancelledBody },
    pending: { title: text.pendingTitle, body: text.pendingBody },
  }[order.paymentStatus]

  return (
    <>
      {order.provider === MOCK_PAYMENT_PROVIDER_NAME && <MockPaymentNotice dict={dict} />}
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 font-serif text-2xl font-semibold text-teal-deep">{outcome.title}</h1>
        <p className="mb-6 text-muted-foreground">{outcome.body}</p>

        <p className="mb-6 rounded-md bg-secondary px-4 py-3 text-lg font-semibold text-teal-deep">
          {text.orderNumber}: {order.id}
        </p>

        {order.paymentStatus === 'paid' && (
          <section className="mb-6">
            <h2 className="mb-1 font-serif text-lg font-semibold text-teal-deep">{text.nextStepsTitle}</h2>
            <p className="text-sm leading-relaxed">{order.isPickup ? text.nextStepsPickup : text.nextStepsPost}</p>
          </section>
        )}

        <h2 className="mb-2 font-serif text-lg font-semibold text-teal-deep">{text.items}</h2>
        <ul className="mb-4 flex flex-col divide-y divide-border rounded-md border border-border bg-card">
          {order.lines.map((line) => (
            <li key={line.id} className="flex items-baseline justify-between gap-4 px-4 py-2 text-sm">
              <span>
                {line.title} <span className="text-muted-foreground">× {line.quantity}</span>
              </span>
              <span className="shrink-0 font-medium">{money(line.unitPrice * line.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="mb-8 flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{text.subtotal}</dt>
            <dd>{money(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{text.shipping}</dt>
            <dd>{order.shippingCost === 0 ? text.shippingFree : money(order.shippingCost)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>{text.total}</dt>
            <dd>{money(order.total)}</dd>
          </div>
        </dl>

        {order.paymentStatus === 'paid' ? (
          <Link href={cataloguePath(locale)} className={linkButton}>
            {text.backToShop}
          </Link>
        ) : (
          <Link href={cartLink} className={linkButton}>
            {text.backToCart}
          </Link>
        )}
        {order.paymentStatus !== 'paid' && (
          <Link href={cataloguePath(locale)} className={`${secondaryLink} ms-4`}>
            {text.backToShop}
          </Link>
        )}
      </div>
    </>
  )
}
