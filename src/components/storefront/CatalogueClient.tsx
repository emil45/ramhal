'use client'

import { SearchIcon, SearchXIcon } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'

import { ProductCard } from '@/components/storefront/ProductCard'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { filterCatalogue } from '@/lib/bookSearch'
import { COVER_ASPECT_RATIO } from '@/lib/cover'

import type { CatalogueBook } from '@/lib/booksData'
import type { Category } from '@/payload-types'
import type { Locale } from '@/lib/locale'

const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5'
const SKELETON_CARD_COUNT = 10

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

  // Typing stays responsive while the list catches up; the skeleton below
  // covers the short gap in which the grid still shows the previous query.
  const deferredQuery = useDeferredValue(query)
  const isFiltering = query !== deferredQuery

  const filtered = useMemo(
    () => filterCatalogue(entries, { categorySlug: categorySlug || null, bookLanguage: bookLanguage || null, query: deferredQuery }),
    [entries, categorySlug, bookLanguage, deferredQuery],
  )

  const languagesPresent = useMemo(
    () => BOOK_LANGUAGES.filter((lang) => entries.some((entry) => entry.bookLanguage === lang)),
    [entries],
  )

  const hasFilters = query !== '' || categorySlug !== '' || bookLanguage !== ''

  const clearFilters = () => {
    setQuery('')
    setCategorySlug('')
    setBookLanguage('')
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-md border border-border bg-paper-deep p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <Field>
            <FieldLabel htmlFor="catalogue-search">{dict.catalogue.searchLabel}</FieldLabel>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="catalogue-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={dict.catalogue.searchPlaceholder}
                className="ps-9"
              />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="catalogue-category">{dict.catalogue.categoryLabel}</FieldLabel>
            <NativeSelect
              id="catalogue-category"
              value={categorySlug}
              onChange={(event) => setCategorySlug(event.target.value)}
              className="w-full"
            >
              <NativeSelectOption value="">{dict.catalogue.allCategories}</NativeSelectOption>
              {categories.map((category) => (
                <NativeSelectOption key={category.id} value={category.slug}>
                  {category.title}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="catalogue-language">{dict.catalogue.languageLabel}</FieldLabel>
            <NativeSelect
              id="catalogue-language"
              value={bookLanguage}
              onChange={(event) => setBookLanguage(event.target.value)}
              className="w-full"
            >
              <NativeSelectOption value="">{dict.catalogue.allLanguages}</NativeSelectOption>
              {languagesPresent.map((lang) => (
                <NativeSelectOption key={lang} value={lang}>
                  {dict.bookLanguageLabel[lang]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
          <p aria-live="polite" className="font-medium text-foreground">
            {dict.catalogue.resultCount(filtered.length)}
          </p>
          {hasFilters ? (
            <Button variant="link" size="sm" onClick={clearFilters}>
              {dict.catalogue.clearFilters}
            </Button>
          ) : null}
        </div>
      </div>

      {isFiltering ? (
        <div className={GRID_CLASS} aria-hidden>
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
            <div key={index} className="flex flex-col gap-3">
              <AspectRatio ratio={COVER_ASPECT_RATIO}>
                <Skeleton className="size-full rounded-[2px]" />
              </AspectRatio>
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle className="type-subheading!">{dict.catalogue.noResultsTitle}</EmptyTitle>
            <EmptyDescription>{dict.catalogue.noResults}</EmptyDescription>
          </EmptyHeader>
          {hasFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              {dict.catalogue.clearFilters}
            </Button>
          ) : null}
        </Empty>
      ) : (
        <div className={GRID_CLASS}>
          {filtered.map((book) => (
            <ProductCard key={book.id} book={book} dict={dict} locale={locale} />
          ))}
        </div>
      )}
    </div>
  )
}
