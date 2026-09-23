'use client'

import { SearchIcon, SearchXIcon } from 'lucide-react'
import { useDeferredValue, useMemo, useRef, useState } from 'react'

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
import { isCatalogueSort, paginateCatalogue, sortCatalogueView } from '@/lib/catalogueView'
import { COVER_ASPECT_RATIO } from '@/lib/cover'
import { LOCALE_CONFIG } from '@/lib/locale'
import { cn } from '@/lib/utils'

import type { CatalogueBook } from '@/lib/booksData'
import type { Category } from '@/payload-types'
import type { Locale } from '@/lib/locale'
import type { CatalogueSort } from '@/lib/catalogueView'

const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5'
const SKELETON_CARD_COUNT = 10
const BOOKS_PER_PAGE = 20

const BOOK_LANGUAGES = ['he', 'fr', 'en', 'he-fr', 'aramaic-fr', 'unknown'] as const

export function CatalogueClient({ books, locale }: { books: CatalogueBook[]; locale: Locale }) {
  // Not passed as a prop from the server component: getDictionary returns
  // plain data plus a couple of functions (pluralised phrases), and
  // functions can't cross the server→client boundary as props. dictionary.ts
  // has no server-only dependency, so calling it here directly is safe.
  const dict = getDictionary(locale)
  const [query, setQuery] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [bookLanguage, setBookLanguage] = useState('')
  const [sort, setSort] = useState<CatalogueSort>('default')
  const [page, setPage] = useState(1)
  const resultsStartRef = useRef<HTMLDivElement>(null)

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
  const sorted = useMemo(
    () => sortCatalogueView(filtered, sort, LOCALE_CONFIG[locale].currency, locale),
    [filtered, locale, sort],
  )
  const cataloguePage = useMemo(() => paginateCatalogue(sorted, page, BOOKS_PER_PAGE), [page, sorted])

  const languagesPresent = useMemo(
    () => BOOK_LANGUAGES.filter((lang) => entries.some((entry) => entry.bookLanguage === lang)),
    [entries],
  )

  // The category filter only appears once the catalogue actually has a
  // choice to offer — today every category but siddurim-machzorim has been
  // removed (docs/DECISIONS.md §24), so this list has at most one entry and
  // the control stays hidden. It returns by itself the moment a second real
  // category is in use, with no code change.
  const categoriesPresent = useMemo(() => {
    const bySlug = new Map<string, Category>()
    for (const book of books) {
      if (book.category && !bySlug.has(book.category.slug)) bySlug.set(book.category.slug, book.category)
    }
    return [...bySlug.values()].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', locale))
  }, [books, locale])
  const hasCategoryFilter = categoriesPresent.length >= 2

  const hasFilters = query !== '' || categorySlug !== '' || bookLanguage !== '' || sort !== 'default'

  const clearFilters = () => {
    setQuery('')
    setCategorySlug('')
    setBookLanguage('')
    setSort('default')
    setPage(1)
  }

  const goToPage = (nextPage: number) => {
    setPage(nextPage)
    requestAnimationFrame(() => resultsStartRef.current?.scrollIntoView({ block: 'start' }))
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 rounded-md border border-border bg-paper-deep p-4 sm:p-5">
        <div
          className={cn(
            'grid gap-4 sm:grid-cols-2',
            hasCategoryFilter ? 'lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]' : 'lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]',
          )}
        >
          <Field className={hasCategoryFilter ? undefined : 'sm:col-span-2 lg:col-span-1'}>
            <FieldLabel htmlFor="catalogue-search">{dict.catalogue.searchLabel}</FieldLabel>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="catalogue-search"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder={dict.catalogue.searchPlaceholder}
                className="ps-9"
              />
            </div>
          </Field>
          {hasCategoryFilter ? (
            <Field>
              <FieldLabel htmlFor="catalogue-category">{dict.catalogue.categoryLabel}</FieldLabel>
              <NativeSelect
                id="catalogue-category"
                value={categorySlug}
                onChange={(event) => {
                  setCategorySlug(event.target.value)
                  setPage(1)
                }}
                className="w-full"
              >
                <NativeSelectOption value="">{dict.catalogue.allCategories}</NativeSelectOption>
                {categoriesPresent.map((category) => (
                  <NativeSelectOption key={category.id} value={category.slug}>
                    {category.title}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          ) : null}
          <Field>
            <FieldLabel htmlFor="catalogue-language">{dict.catalogue.languageLabel}</FieldLabel>
            <NativeSelect
              id="catalogue-language"
              value={bookLanguage}
              onChange={(event) => {
                setBookLanguage(event.target.value)
                setPage(1)
              }}
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
          <Field>
            <FieldLabel htmlFor="catalogue-sort">{dict.catalogue.sortLabel}</FieldLabel>
            <NativeSelect
              id="catalogue-sort"
              value={sort}
              onChange={(event) => {
                if (isCatalogueSort(event.target.value)) setSort(event.target.value)
                setPage(1)
              }}
              className="w-full"
            >
              <NativeSelectOption value="default">{dict.catalogue.sortRecommended}</NativeSelectOption>
              <NativeSelectOption value="title">{dict.catalogue.sortTitle}</NativeSelectOption>
              <NativeSelectOption value="price-ascending">{dict.catalogue.sortPriceAscending}</NativeSelectOption>
              <NativeSelectOption value="price-descending">{dict.catalogue.sortPriceDescending}</NativeSelectOption>
            </NativeSelect>
          </Field>
        </div>
        <div ref={resultsStartRef} className="scroll-mt-28 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
          <p aria-live="polite" className="font-medium text-foreground">
            {cataloguePage.totalItems > 0
              ? dict.catalogue.showingRange(cataloguePage.start, cataloguePage.end, cataloguePage.totalItems)
              : dict.catalogue.resultCount(0)}
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
      ) : cataloguePage.totalItems === 0 ? (
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
        <>
          <div className={GRID_CLASS}>
            {cataloguePage.items.map((book) => (
              <ProductCard key={book.id} book={book} dict={dict} locale={locale} />
            ))}
          </div>
          {cataloguePage.totalPages > 1 ? (
            <nav aria-label={dict.catalogue.paginationLabel} className="flex flex-wrap items-center justify-center gap-2 border-t border-border pt-6">
              <Button variant="outline" onClick={() => goToPage(cataloguePage.page - 1)} disabled={cataloguePage.page === 1}>
                {dict.catalogue.previousPage}
              </Button>
              <div className="flex items-center gap-1" aria-label={dict.catalogue.pageLabel(cataloguePage.page, cataloguePage.totalPages)}>
                {Array.from({ length: cataloguePage.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === cataloguePage.page ? 'default' : 'ghost'}
                    size="icon"
                    aria-current={pageNumber === cataloguePage.page ? 'page' : undefined}
                    aria-label={dict.catalogue.pageLabel(pageNumber, cataloguePage.totalPages)}
                    onClick={() => goToPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => goToPage(cataloguePage.page + 1)}
                disabled={cataloguePage.page === cataloguePage.totalPages}
              >
                {dict.catalogue.nextPage}
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  )
}
