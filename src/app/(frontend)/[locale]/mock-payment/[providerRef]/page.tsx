import { notFound } from 'next/navigation'

import { getDictionary } from '@/app/(frontend)/dictionary'
import { MockPaymentChoices } from '@/components/storefront/MockPaymentChoices'
import { MockPaymentNotice } from '@/components/storefront/MockPaymentNotice'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { Card, CardContent } from '@/components/ui/card'
import { isLocale } from '@/lib/locale'
import { isMockPaymentProviderConfigured } from '@/lib/payment/getPaymentProvider'
import { findMockPaymentSession } from '@/lib/payment/mockPaymentProvider'
import { formatPrice } from '@/lib/price'

// Reads live payment state — never cacheable.
export const dynamic = 'force-dynamic'

export default async function MockPaymentPage({ params }: PageProps<'/[locale]/mock-payment/[providerRef]'>) {
  const { locale, providerRef } = await params
  if (!isLocale(locale)) notFound()
  if (!isMockPaymentProviderConfigured()) notFound()

  const session = await findMockPaymentSession(providerRef)
  if (!session) notFound()

  const dict = getDictionary(locale)

  return (
    <>
      <MockPaymentNotice dict={dict} />
      <div className="page-container max-w-xl py-10">
        <SectionHeading as="h1">{dict.mockPayment.pageTitle}</SectionHeading>
        <p className="mb-6 text-muted-foreground">{dict.mockPayment.intro}</p>

        <Card className="mb-6">
          <CardContent>
            <dl className="flex flex-col gap-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{dict.mockPayment.orderNumber}</dt>
                <dd className="font-medium tabular-nums">{session.orderNumber}</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-muted-foreground">{dict.mockPayment.amount}</dt>
                <dd className="text-2xl font-semibold tabular-nums text-teal-deep">{formatPrice(session.total, session.currency, locale)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <MockPaymentChoices
          labels={{ pay: dict.mockPayment.pay, decline: dict.mockPayment.decline, cancel: dict.mockPayment.cancel }}
          providerRef={providerRef}
        />
      </div>
    </>
  )
}
