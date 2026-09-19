import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CartLineControls } from '@/components/storefront/CartLineControls'
import { CoverImage } from '@/components/storefront/CoverImage'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { cartSubtotal, cartUnits, unitsUntilFreeShipping } from '@/lib/cart'
import { calculateShipping } from '@/lib/shipping'
import { getShippingZones } from '@/lib/shippingData'
import { isLocale, LOCALE_CONFIG } from '@/lib/locale'
import { formatPrice, selectPrice } from '@/lib/price'
import { bookPath, cataloguePath, localePath } from '@/lib/routes'
import { getCartLines } from '@/lib/serverCart'
import { cn } from '@/lib/utils'

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
      <div className="page-container py-12">
        <SectionHeading as="h1">{dict.cart.title}</SectionHeading>
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingBag />
            </EmptyMedia>
            <EmptyTitle className="type-subheading!">{dict.cart.empty}</EmptyTitle>
          </EmptyHeader>
          <Link href={cataloguePath(locale)} className={buttonVariants({ size: 'lg' })}>
            {dict.cart.browse}
          </Link>
        </Empty>
      </div>
    )
  }

  const units = cartUnits(lines)
  const subtotal = cartSubtotal(lines, currency)
  const shipping = calculateShipping(zones, { countryCode: estimatedShippingCountry, units })
  const zone = zones.find((z) => z.name === shipping.zoneName) ?? null
  const remainingForFreeShipping = zone ? unitsUntilFreeShipping(zone, units) : null
  const money = (amount: number, amountCurrency = currency) => formatPrice(amount, amountCurrency, locale)

  return (
    <div className="page-container py-10">
      <SectionHeading as="h1">{dict.cart.title}</SectionHeading>

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-14">
        <ul className="flex flex-col">
          {lines.map((line) => {
            const lineAmount = selectPrice(line.book, currency)
            return (
              <li key={line.book.id} className="flex gap-5 border-b border-border py-6 first:pt-0">
                <div className="w-24 shrink-0 sm:w-28">
                  <CoverImage
                    categorySlug={typeof line.book.category === 'object' ? line.book.category?.slug : null}
                    cover={typeof line.book.cover === 'object' ? line.book.cover : null}
                    sizes="112px"
                    title={line.book.title}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={bookPath(locale, line.book.urlSlug)} className="type-subheading hover:text-teal">
                      {line.book.title}
                    </Link>
                    <span className="shrink-0 text-lg font-semibold tabular-nums text-teal-deep">
                      {lineAmount !== null ? money(lineAmount * line.quantity) : '—'}
                    </span>
                  </div>
                  {lineAmount !== null && line.quantity > 1 ? (
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {money(lineAmount)} × {line.quantity}
                    </span>
                  ) : null}
                  <div className="mt-auto pt-2">
                    <CartLineControls bookId={line.book.id} locale={locale} quantity={line.quantity} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="type-subheading!">{dict.checkout.summaryHeading}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{dict.cart.subtotal}</span>
              <span className="font-medium tabular-nums">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{dict.cart.shippingEstimate}</span>
              <span className="font-medium tabular-nums">{money(shipping.amount, shipping.currency)}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{dict.cart.shippingEstimateNote}</p>

            {remainingForFreeShipping !== null && (
              <p className="rounded-sm bg-paper-deep px-3 py-2 font-medium text-teal-deep">
                {remainingForFreeShipping === 0 ? dict.cart.freeShippingReached : dict.cart.freeShippingNudge(remainingForFreeShipping)}
              </p>
            )}

            <Separator />
            <div className="flex items-baseline justify-between text-base font-semibold">
              <span>{dict.cart.total}</span>
              <span className="text-xl tabular-nums text-teal-deep">{money(subtotal)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link href={localePath(locale, '/checkout')} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
              {dict.cart.proceedToCheckout}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
