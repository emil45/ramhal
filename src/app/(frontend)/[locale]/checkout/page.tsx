import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getDictionary } from '@/app/(frontend)/dictionary'
import { CheckoutForm } from '@/components/storefront/CheckoutForm'
import { MockPaymentNotice } from '@/components/storefront/MockPaymentNotice'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { buttonVariants } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { titleWithColor } from '@/lib/books/bookColors'
import { cartSubtotal, cartUnits } from '@/lib/shop/cart'
import { defaultDestinationCountry } from '@/lib/shop/defaultDestination'
import { countriesServedInCurrency } from '@/lib/shop/orderPricing'
import { isLocale, LOCALE_CONFIG } from '@/lib/locale/locale'
import { isMockPaymentProviderConfigured } from '@/lib/payment/getPaymentProvider'
import { selectPrice } from '@/lib/shop/price'
import { localePath } from '@/lib/locale/routes'
import { getCartLines } from '@/lib/shop/serverCart'
import { getShippingZones } from '@/lib/shop/shippingData'

// Set by Vercel's edge from the visitor's IP; absent locally and on a preview
// without it, in which case the language's country is used.
const VISITOR_COUNTRY_HEADER = 'x-vercel-ip-country'

// Reads the session cookie, so it can never be statically generated.
export const dynamic = 'force-dynamic'

export default async function CheckoutPage({ params }: PageProps<'/[locale]/checkout'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale)
  const { currency, estimatedShippingCountry, intlTag } = LOCALE_CONFIG[locale]

  const [lines, zones, requestHeaders] = await Promise.all([getCartLines(locale), getShippingZones(), headers()])

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
          defaultCountry={defaultDestinationCountry({
            servedCountries: countries.map((country) => country.code),
            visitorCountry: requestHeaders.get(VISITOR_COUNTRY_HEADER),
            languageCountry: estimatedShippingCountry,
          })}
          lines={lines.map((line) => ({
            bookId: line.book.id,
            // A book can legitimately have no title in the current locale —
            // this becomes the order's own permanent snapshot of what was
            // sold, so it falls back to the same
            // he -> fr -> en display title the admin uses, never to blank.
            title: titleWithColor(line.book.title ?? line.book.displayTitle ?? '', line.color),
            colorId: line.color?.id ?? null,
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
