import Link from 'next/link'

import { BookBadges } from '@/components/storefront/BookBadges'
import { CoverImage } from '@/components/storefront/CoverImage'
import { PriceTag } from '@/components/storefront/PriceTag'
import { QuickAddButton } from '@/components/storefront/QuickAddButton'
import { buttonVariants } from '@/components/ui/button'
import { isPurchasable } from '@/lib/books/availability'
import { LOCALE_CONFIG } from '@/lib/locale/locale'
import { bookPath } from '@/lib/locale/routes'
import { selectSale } from '@/lib/shop/salePrice'
import { cn } from '@/lib/utils'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { CatalogueBook } from '@/lib/books/booksData'
import type { Locale } from '@/lib/locale/locale'

/**
 * A book on the shelf: the cover large, the title, the price and a way to
 * buy it. The whole card opens the book; the button above it
 * buys without leaving the catalogue — except for a book that comes in
 * colours, whose colour is chosen on its own page.
 */
export function ProductCard({
  book,
  dict,
  locale,
}: {
  book: CatalogueBook
  dict: Dictionary
  locale: Locale
}) {
  const currency = LOCALE_CONFIG[locale].currency
  const href = bookPath(locale, book.urlSlug)
  const sale = selectSale(book, currency)

  return (
    <article className="product-card group/cover relative flex h-full flex-col">
      <div className="product-cover relative">
        <CoverImage
          book={{ bookLanguage: book.bookLanguage, categorySlug: book.category?.slug }}
          cover={typeof book.cover === 'object' ? book.cover : null}
          sizes="(min-width: 1024px) 260px, (min-width: 640px) 30vw, 45vw"
          title={book.displayTitle}
        />
        <BookBadges dict={dict} isNew={book.markedNew === true} percentOff={sale?.percentOff ?? null} />
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <h3 className="type-subheading line-clamp-2 wrap-anywhere text-foreground">
          <Link
            href={href}
            className="decoration-gold decoration-2 underline-offset-4 transition-colors after:absolute after:inset-0 group-hover/cover:text-teal group-hover/cover:underline"
          >
            <bdi>{book.displayTitle}</bdi>
          </Link>
        </h3>
        {/* Grid rows stretch every card to the tallest, so pushing price and
            button to the bottom lines them up across the row. */}
        <div className="product-meta mt-auto">
          <PriceTag book={book} dict={dict} locale={locale} className="text-lg" />
          {!isPurchasable(book, currency) ? null : book.hasColors ? (
            <Link
              href={href}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'quick-add relative z-10 text-teal-deep hover:border-teal',
              )}
            >
              {dict.book.chooseColor}
            </Link>
          ) : (
            <QuickAddButton bookId={book.id} locale={locale} />
          )}
        </div>
      </div>
    </article>
  )
}
