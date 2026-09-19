import { notFound } from 'next/navigation'

import { getDictionary } from '@/app/(frontend)/dictionary'
import { MockPaymentChoices } from '@/components/storefront/MockPaymentChoices'
import { MockPaymentNotice } from '@/components/storefront/MockPaymentNotice'
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
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-2 font-serif text-2xl font-semibold text-teal-deep">{dict.mockPayment.pageTitle}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{dict.mockPayment.intro}</p>

        <dl className="mb-6 flex flex-col gap-2 rounded-md border border-border bg-card p-4">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{dict.mockPayment.orderNumber}</dt>
            <dd className="font-medium">{session.orderNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{dict.mockPayment.amount}</dt>
            <dd className="font-semibold">{formatPrice(session.total, session.currency, locale)}</dd>
          </div>
        </dl>

        <MockPaymentChoices
          labels={{ pay: dict.mockPayment.pay, decline: dict.mockPayment.decline, cancel: dict.mockPayment.cancel }}
          providerRef={providerRef}
        />
      </div>
    </>
  )
}
