import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getDictionary } from '@/app/(frontend)/dictionary'
import { MockPaymentNotice } from '@/components/storefront/MockPaymentNotice'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { isLocale } from '@/lib/locale'
import { MOCK_PAYMENT_PROVIDER_NAME } from '@/lib/payment/paymentConfiguration'
import { findOrderByPublicToken } from '@/lib/payment/settleOrderPayment'
import { formatPrice } from '@/lib/price'
import { cataloguePath, localePath } from '@/lib/routes'
import { cn } from '@/lib/utils'

// Reflects the order's live payment state — never cacheable.
export const dynamic = 'force-dynamic'

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

  const primaryHref = order.paymentStatus === 'paid' ? cataloguePath(locale) : cartLink
  const primaryLabel = order.paymentStatus === 'paid' ? text.backToShop : text.backToCart

  return (
    <>
      {order.provider === MOCK_PAYMENT_PROVIDER_NAME && <MockPaymentNotice dict={dict} />}
      <div className="page-container max-w-3xl py-10">
        <SectionHeading as="h1">{outcome.title}</SectionHeading>
        <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{outcome.body}</p>

        <p className="mb-8 flex items-baseline justify-between gap-4 rounded-md border border-gold bg-paper-deep px-5 py-4">
          <span className="text-muted-foreground">{text.orderNumber}</span>
          <span className="text-2xl font-semibold tabular-nums text-teal-deep">{order.id}</span>
        </p>

        {order.paymentStatus === 'paid' && (
          <section className="mb-8">
            <h2 className="type-subheading mb-2 text-teal-deep">{text.nextStepsTitle}</h2>
            <p className="leading-relaxed">{order.isPickup ? text.nextStepsPickup : text.nextStepsPost}</p>
          </section>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="type-subheading!">{text.items}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {order.lines.map((line) => (
                <li key={line.id} className="flex items-baseline justify-between gap-4 text-sm">
                  <span>
                    {line.title} <span className="text-muted-foreground">× {line.quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{money(line.unitPrice * line.quantity)}</span>
                </li>
              ))}
            </ul>
            <Separator />
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{text.subtotal}</dt>
                <dd className="tabular-nums">{money(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{text.shipping}</dt>
                <dd className="tabular-nums">{order.shippingCost === 0 ? text.shippingFree : money(order.shippingCost)}</dd>
              </div>
              <Separator />
              <div className="flex items-baseline justify-between font-semibold">
                <dt>{text.total}</dt>
                <dd className="text-xl tabular-nums text-teal-deep">{money(order.total)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Link href={primaryHref} className={buttonVariants({ size: 'lg' })}>
            {primaryLabel}
          </Link>
          {order.paymentStatus !== 'paid' && (
            <Link href={cataloguePath(locale)} className={cn(buttonVariants({ size: 'lg', variant: 'ghost' }))}>
              {text.backToShop}
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
