import Link from 'next/link'

import { CoverImage } from '@/components/storefront/CoverImage'
import { PriceTag } from '@/components/storefront/PriceTag'
import { bookPath } from '@/lib/routes'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { CatalogueBook } from '@/lib/booksData'
import type { Locale } from '@/lib/locale'

export function ProductCard({ book, dict, locale }: { book: CatalogueBook; dict: Dictionary; locale: Locale }) {
  return (
    <Link
      href={bookPath(locale, book.urlSlug)}
      className="group/cover flex h-full flex-col gap-3 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <CoverImage
        categorySlug={book.category?.slug}
        cover={typeof book.cover === 'object' ? book.cover : null}
        sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
        title={book.displayTitle}
      />
      {/* Two lines are reserved whether the title uses them or not, and the
          price row is pushed to the bottom of a card that stretches to the
          row's height — so every price in a row sits on one baseline. */}
      <h3 className="type-subheading line-clamp-2 min-h-[2lh] text-foreground decoration-gold decoration-2 underline-offset-4 transition-colors group-hover/cover:text-teal group-hover/cover:underline">
        {book.displayTitle}
      </h3>
      <div className="mt-auto flex min-h-7 items-center text-lg">
        <PriceTag book={book} dict={dict} locale={locale} />
      </div>
    </Link>
  )
}
