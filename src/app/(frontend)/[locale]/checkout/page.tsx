import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getDictionary } from '@/app/(frontend)/dictionary'
import { CheckoutForm } from '@/components/storefront/CheckoutForm'
import { MockPaymentNotice } from '@/components/storefront/MockPaymentNotice'
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
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="mb-3 font-serif text-2xl font-semibold text-teal-deep">{dict.checkout.title}</h1>
        <p className="mb-4 text-muted-foreground">{dict.checkout.emptyCart}</p>
        <Link href={localePath(locale, '/cart')} className="text-teal underline-offset-4 hover:underline">
          {dict.checkout.backToCart}
        </Link>
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
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 font-serif text-2xl font-semibold text-teal-deep">{dict.checkout.title}</h1>
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
