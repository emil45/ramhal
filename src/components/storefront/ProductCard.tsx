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
      href={bookPath(locale, book.displaySlug)}
      className="group flex flex-col gap-2 rounded-lg p-2 transition-colors hover:bg-secondary/60"
    >
      <CoverImage
        categorySlug={book.category?.slug}
        cover={typeof book.cover === 'object' ? book.cover : null}
        sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
        title={book.displayTitle}
      />
      <div className="flex flex-col gap-0.5">
        <h3 className="line-clamp-2 font-serif text-sm font-medium text-foreground group-hover:text-teal">
          {book.displayTitle}
        </h3>
        {book.subtitle ? <p className="line-clamp-1 text-xs text-muted-foreground">{book.subtitle}</p> : null}
        <div className="pt-1 text-sm">
          <PriceTag book={book} dict={dict} locale={locale} />
        </div>
      </div>
    </Link>
  )
}
