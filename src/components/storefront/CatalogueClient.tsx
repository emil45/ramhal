'use client'

import { useMemo, useState } from 'react'

import { ProductCard } from '@/components/storefront/ProductCard'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { filterCatalogue } from '@/lib/bookSearch'

import type { CatalogueBook } from '@/lib/booksData'
import type { Category } from '@/payload-types'
import type { Locale } from '@/lib/locale'

const BOOK_LANGUAGES = ['he', 'fr', 'en', 'he-fr', 'aramaic-fr', 'unknown'] as const

export function CatalogueClient({
  books,
  categories,
  locale,
}: {
  books: CatalogueBook[]
  categories: Category[]
  locale: Locale
}) {
  // Not passed as a prop from the server component: getDictionary returns
  // plain data plus a couple of functions (pluralised phrases), and
  // functions can't cross the server→client boundary as props. dictionary.ts
  // has no server-only dependency, so calling it here directly is safe.
  const dict = getDictionary(locale)
  const [query, setQuery] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [bookLanguage, setBookLanguage] = useState('')

  // filterCatalogue matches on `title` — explicitly the resolved
  // displayTitle, not Book's own possibly-blank per-locale `title` (see
  // lib/booksData.ts), otherwise searching a book with no title in this
  // locale crashes normalizeForSearch on undefined.
  const entries = useMemo(
    () => books.map((book) => ({ ...book, categorySlug: book.category?.slug ?? null, title: book.displayTitle })),
    [books],
  )

  const filtered = useMemo(
    () => filterCatalogue(entries, { categorySlug: categorySlug || null, bookLanguage: bookLanguage || null, query }),
    [entries, categorySlug, bookLanguage, query],
  )

  const languagesPresent = useMemo(
    () => BOOK_LANGUAGES.filter((lang) => entries.some((entry) => entry.bookLanguage === lang)),
    [entries],
  )

  const hasFilters = query !== '' || categorySlug !== '' || bookLanguage !== ''

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={dict.catalogue.searchPlaceholder}
          className="h-9 min-w-40 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <select
          value={categorySlug}
          onChange={(event) => setCategorySlug(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">{dict.catalogue.allCategories}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.title}
            </option>
          ))}
        </select>
        <select
          value={bookLanguage}
          onChange={(event) => setBookLanguage(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">{dict.catalogue.allLanguages}</option>
          {languagesPresent.map((lang) => (
            <option key={lang} value={lang}>
              {dict.bookLanguageLabel[lang]}
            </option>
          ))}
        </select>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setCategorySlug('')
              setBookLanguage('')
            }}
            className="text-sm text-teal underline-offset-4 hover:underline"
          >
            {dict.catalogue.clearFilters}
          </button>
        ) : null}
        <span className="text-sm text-muted-foreground">{dict.catalogue.resultCount(filtered.length)}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{dict.catalogue.noResults}</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((book) => (
            <ProductCard key={book.id} book={book} dict={dict} locale={locale} />
          ))}
        </div>
      )}
    </div>
  )
}
