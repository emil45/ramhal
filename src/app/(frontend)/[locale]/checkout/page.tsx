import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getDictionary } from '@/app/(frontend)/dictionary'
import { CheckoutForm } from '@/components/storefront/CheckoutForm'
import { MockPaymentNotice } from '@/components/storefront/MockPaymentNotice'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { buttonVariants } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { cartSubtotal, cartUnits } from '@/lib/cart'
import { countriesServedInCurrency } from '@/lib/orderPricing'
import { isLocale, LOCALE_CONFIG } from '@/lib/locale'
import { isMockPaymentProviderConfigured } from '@/lib/payment/getPaymentProvider'
import { selectPrice } from '@/lib/price'
import { localePath } from '@/lib/routes'
import { getCartLines } from '@/lib/serverCart'
import { getShippingZones } from '@/lib/shippingData'

// Reads the session cookie, so it can never be statically generated.
export const dynamic = 'force-dynamic'

export default async function CheckoutPage({ params }: PageProps<'/[locale]/checkout'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale)
  const { currency, estimatedShippingCountry, intlTag } = LOCALE_CONFIG[locale]

  const [lines, zones] = await Promise.all([getCartLines(locale), getShippingZones()])

  if (lines.length === 0) {
    return (
      <div className="page-container py-12">
        <SectionHeading as="h1">{dict.checkout.title}</SectionHeading>
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyTitle className="type-subheading!">{dict.checkout.emptyCart}</EmptyTitle>
          </EmptyHeader>
          <Link href={localePath(locale, '/cart')} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            {dict.checkout.backToCart}
          </Link>
        </Empty>
      </div>
    )
  }

  const regionNames = new Intl.DisplayNames(intlTag, { type: 'region' })
  const countries = countriesServedInCurrency(zones, currency).map((code) => ({
    code,
    name: regionNames.of(code) ?? code,
  }))

  return (
    <>
      {isMockPaymentProviderConfigured() && <MockPaymentNotice dict={dict} />}
      <div className="page-container py-10">
        <SectionHeading as="h1">{dict.checkout.title}</SectionHeading>
        <CheckoutForm
          countries={countries}
          currency={currency}
          defaultCountry={countries.some((country) => country.code === estimatedShippingCountry) ? estimatedShippingCountry : countries[0]?.code}
          lines={lines.map((line) => ({
            bookId: line.book.id,
            title: line.book.title,
            quantity: line.quantity,
            unitPrice: selectPrice(line.book, currency) ?? 0,
          }))}
          locale={locale}
          subtotal={cartSubtotal(lines, currency)}
          units={cartUnits(lines)}
          zones={zones}
        />
      </div>
    </>
  )
}
