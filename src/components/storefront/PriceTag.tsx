import { Badge } from '@/components/ui/badge'
import { isPurchasable } from '@/lib/books/availability'
import { LOCALE_CONFIG } from '@/lib/locale/locale'
import { formatPrice, selectPrice } from '@/lib/shop/price'
import { selectSale } from '@/lib/shop/salePrice'
import { cn } from '@/lib/utils'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { Locale } from '@/lib/locale/locale'

type PricedItem = { prices: { amount: number; compareAtAmount?: number | null; currency: string }[] }

/**
 * A book with no price in the viewer's currency, or a real 0.00, is visible
 * and clearly not purchasable — never hidden, never free (§3b). Used on
 * both the catalogue card and the book page, so the rule reads the same
 * everywhere. Says so quietly, in a badge: it is a fact about the book, not
 * an alarm. On sale, the earlier price follows the real one, crossed out.
 */
export function PriceTag({ book, dict, locale, className }: { book: PricedItem; dict: Dictionary; locale: Locale; className?: string }) {
  const currency = LOCALE_CONFIG[locale].currency
  const amount = selectPrice(book, currency)
  const purchasable = isPurchasable(book, currency)
  const sale = selectSale(book, currency)

  if (amount !== null && purchasable) {
    return (
      <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', className)}>
        <span className="font-semibold tabular-nums text-teal-deep">{formatPrice(amount, currency, locale)}</span>
        {sale ? (
          <span className="text-[0.85em] text-muted-foreground">
            <span className="sr-only">{dict.book.priceBefore} </span>
            <s className="tabular-nums decoration-1">{formatPrice(sale.compareAtAmount, currency, locale)}</s>
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <Badge variant="secondary" className="h-auto rounded-[3px] py-1 text-sm font-normal whitespace-normal text-foreground">
      {dict.book.unavailableTitle}
    </Badge>
  )
}
