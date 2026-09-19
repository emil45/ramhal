import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CartLineControls } from '@/components/storefront/CartLineControls'
import { CoverImage } from '@/components/storefront/CoverImage'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { cartSubtotal, cartUnits, unitsUntilFreeShipping } from '@/lib/cart'
import { calculateShipping } from '@/lib/shipping'
import { getShippingZones } from '@/lib/shippingData'
import { isLocale, LOCALE_CONFIG } from '@/lib/locale'
import { formatPrice, selectPrice } from '@/lib/price'
import { bookPath, localePath } from '@/lib/routes'
import { getCartLines } from '@/lib/serverCart'

// Reads the session cookie, so it can never be statically generated — see
// docs/tasks/TASK-06-storefront.md §7 ("Cart is dynamic").
export const dynamic = 'force-dynamic'

export default async function CartPage({ params }: PageProps<'/[locale]/cart'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale)
  const { currency, estimatedShippingCountry } = LOCALE_CONFIG[locale]

  const [lines, zones] = await Promise.all([getCartLines(locale), getShippingZones()])

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="mb-3 font-serif text-2xl font-semibold text-teal-deep">{dict.cart.title}</h1>
        <p className="mb-4 text-muted-foreground">{dict.cart.empty}</p>
        <Link href={localePath(locale, '/')} className="text-teal underline-offset-4 hover:underline">
          {dict.cart.browse}
        </Link>
      </div>
    )
  }

  const units = cartUnits(lines)
  const subtotal = cartSubtotal(lines, currency)
  const shipping = calculateShipping(zones, { countryCode: estimatedShippingCountry, units })
  const zone = zones.find((z) => z.name === shipping.zoneName) ?? null
  const remainingForFreeShipping = zone ? unitsUntilFreeShipping(zone, units) : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-serif text-2xl font-semibold text-teal-deep">{dict.cart.title}</h1>

      <ul className="flex flex-col gap-4">
        {lines.map((line) => {
          const lineAmount = selectPrice(line.book, currency)
          return (
            <li key={line.book.id} className="flex gap-4 border-b border-border pb-4">
              <div className="w-20 shrink-0">
                <CoverImage
                  categorySlug={typeof line.book.category === 'object' ? line.book.category?.slug : null}
                  cover={typeof line.book.cover === 'object' ? line.book.cover : null}
                  sizes="80px"
                  title={line.book.title}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Link
                  href={bookPath(locale, line.book.urlSlug)}
                  className="font-serif font-medium text-foreground hover:text-teal"
                >
                  {line.book.title}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {lineAmount !== null ? formatPrice(lineAmount, currency, locale) : '—'}
                </span>
                <CartLineControls bookId={line.book.id} locale={locale} quantity={line.quantity} />
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{dict.cart.subtotal}</span>
          <span className="font-medium">{formatPrice(subtotal, currency, locale)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{dict.cart.shippingEstimate}</span>
          <span className="font-medium">{formatPrice(shipping.amount, shipping.currency, locale)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{dict.cart.shippingEstimateNote}</p>

        {remainingForFreeShipping !== null && (
          <p className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-teal-deep">
            {remainingForFreeShipping === 0 ? dict.cart.freeShippingReached : dict.cart.freeShippingNudge(remainingForFreeShipping)}
          </p>
        )}

        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <span>{dict.cart.total}</span>
          <span>{formatPrice(subtotal, currency, locale)}</span>
        </div>

        <Link
          href={localePath(locale, '/checkout')}
          className="mt-3 rounded-md bg-teal px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-teal-deep"
        >
          {dict.cart.proceedToCheckout}
        </Link>
      </div>
    </div>
  )
}
