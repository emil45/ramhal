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
import { filterCatalogue } from '@/lib/books/bookSearch'
import {
  defaultBookLanguage,
  isCatalogueSort,
  paginateCatalogue,
  shelfOf,
  shelvesPresent,
  sortCatalogueView,
} from '@/lib/books/catalogueView'
import { COVER_ASPECT_RATIO } from '@/lib/books/cover'
import { LOCALE_CONFIG } from '@/lib/locale/locale'
import { cn } from '@/lib/utils'

import type { CatalogueBook } from '@/lib/books/booksData'
import type { Category } from '@/payload-types'
import type { Locale } from '@/lib/locale/locale'
import type { CatalogueShelf, CatalogueSort } from '@/lib/books/catalogueView'

const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8'
const SKELETON_CARD_COUNT = 8
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
  const shelves = useMemo(() => shelvesPresent(books), [books])
  const [shelf, setShelf] = useState<CatalogueShelf>(shelves[0] ?? 'institute')
  const shelfBooks = useMemo(() => books.filter((book) => shelfOf(book) === shelf), [books, shelf])
  // Each shelf opens on the site's language if it holds any, otherwise on
  // every language, so switching shelf never lands on an empty one.
  const defaultLanguage = defaultBookLanguage(locale, shelfBooks)
  const [bookLanguage, setBookLanguage] = useState(defaultLanguage)
  const [sort, setSort] = useState<CatalogueSort>('default')
  const [page, setPage] = useState(1)
  const resultsStartRef = useRef<HTMLDivElement>(null)

  // filterCatalogue matches on `title` — explicitly the resolved
  // displayTitle, not Book's own possibly-blank per-locale `title` (see
  // lib/booksData.ts), otherwise searching a book with no title in this
  // locale crashes normalizeForSearch on undefined.
  const entries = useMemo(
    () => shelfBooks.map((book) => ({ ...book, categorySlug: book.category?.slug ?? null, title: book.displayTitle })),
    [shelfBooks],
  )

  // Typing stays responsive while the list catches up; the skeleton below
  // covers the short gap in which the grid still shows the previous query.
  const deferredQuery = useDeferredValue(query)
  const isFiltering = query !== deferredQuery

  const filtered = useMemo(
    () => filterCatalogue(entries, { categorySlug: categorySlug || null, bookLanguage: bookLanguage || null, query: deferredQuery }),
    [entries, categorySlug, bookLanguage, deferredQuery],
  )
  const sorted = useMemo(() => sortCatalogueView(filtered, sort, LOCALE_CONFIG[locale].currency, locale), [filtered, locale, sort])
  const cataloguePage = useMemo(() => paginateCatalogue(sorted, page, BOOKS_PER_PAGE), [page, sorted])

  const languagesPresent = useMemo(() => BOOK_LANGUAGES.filter((lang) => entries.some((entry) => entry.bookLanguage === lang)), [entries])

  // The category filter only appears once the catalogue actually has a
  // choice to offer — today every category but siddurim-machzorim has been
  // removed, so this list has at most one entry and
  // the control stays hidden. It returns by itself the moment a second real
  // category is in use, with no code change.
  const categoriesPresent = useMemo(() => {
    const bySlug = new Map<string, Category>()
    for (const book of shelfBooks) {
      if (book.category && !bySlug.has(book.category.slug)) bySlug.set(book.category.slug, book.category)
    }
    return [...bySlug.values()].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', locale))
  }, [shelfBooks, locale])
  const hasCategoryFilter = categoriesPresent.length >= 2

  const hasFilters = query !== '' || categorySlug !== '' || bookLanguage !== defaultLanguage || sort !== 'default'

  const clearFilters = () => {
    setQuery('')
    setCategorySlug('')
    setBookLanguage(defaultLanguage)
    setSort('default')
    setPage(1)
  }

  const chooseShelf = (nextShelf: CatalogueShelf) => {
    setShelf(nextShelf)
    setCategorySlug('')
    setBookLanguage(
      defaultBookLanguage(
        locale,
        books.filter((book) => shelfOf(book) === nextShelf),
      ),
    )
    setPage(1)
  }

  const chooseLanguage = (nextLanguage: string) => {
    setBookLanguage(nextLanguage)
    setPage(1)
  }

  // The empty string is "every language", as in the filter itself.
  const languageOptions: ('' | (typeof BOOK_LANGUAGES)[number])[] = ['', ...languagesPresent]

  const languageCount = (language: string) => entries.filter((entry) => !language || entry.bookLanguage === language).length

  const goToPage = (nextPage: number) => {
    setPage(nextPage)
    requestAnimationFrame(() => resultsStartRef.current?.scrollIntoView({ block: 'start' }))
  }

  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-paper-deep">
        <div className="page-container pt-10 md:pt-14">
          <div className="flex max-w-2xl flex-col gap-3">
            <h1 className="type-display">{dict.catalogue.title}</h1>
            <p className="text-lg text-muted-foreground">{dict.catalogue.intro}</p>
          </div>
          {shelves.length > 1 ? (
            <div role="tablist" aria-label={dict.catalogue.shelvesLabel} className="-mb-px mt-8 flex gap-1 md:mt-10">
              {shelves.map((option) => {
                const selected = option === shelf
                return (
                  <Button
                    key={option}
                    role="tab"
                    variant="ghost"
                    aria-selected={selected}
                    onClick={() => chooseShelf(option)}
                    className={cn(
                      'h-auto min-w-0 flex-1 rounded-none rounded-t-[0.25rem] border border-transparent px-2 py-3 font-serif text-base font-medium sm:flex-none sm:px-5 sm:text-lg md:px-7 md:text-xl',
                      selected
                        ? 'border-border border-b-background bg-background text-teal-deep hover:bg-background'
                        : 'text-muted-foreground hover:bg-paper hover:text-teal',
                    )}
                  >
                    {dict.catalogue.shelf[option]}
                    <span className="font-sans text-sm text-muted-foreground tabular-nums">
                      {books.filter((book) => shelfOf(book) === option).length}
                    </span>
                  </Button>
                )
              })}
            </div>
          ) : (
            <div className="h-10" />
          )}
        </div>
      </section>

      <div className="page-container flex flex-col gap-10 py-8 md:py-10">
        <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          {languagesPresent.length > 1 ? (
            <div role="radiogroup" aria-labelledby="catalogue-language-label" className="flex flex-col gap-2">
              <span id="catalogue-language-label" className="text-sm font-medium text-foreground">
                {dict.catalogue.languageLabel}
              </span>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                {languageOptions.map((language) => {
                  const selected = language === bookLanguage
                  return (
                    <Button
                      key={language || 'all'}
                      role="radio"
                      aria-checked={selected}
                      variant={selected ? 'default' : 'outline'}
                      onClick={() => chooseLanguage(language)}
                      className={cn(
                        'h-12 shrink-0 px-4',
                        selected ? '' : 'border-border bg-card text-foreground hover:border-teal hover:text-teal',
                      )}
                    >
                      {language ? dict.bookLanguageLabel[language] : dict.catalogue.allLanguages}
                      <span className={cn('text-sm tabular-nums', selected ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
                        {languageCount(language)}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div />
          )}
          <div
            className={cn(
              'grid grid-cols-2 gap-3 sm:gap-4',
              hasCategoryFilter ? 'lg:grid-cols-[16rem_12rem_12rem]' : 'lg:grid-cols-[18rem_13rem]',
            )}
          >
            <Field>
              <FieldLabel htmlFor="catalogue-search">{dict.catalogue.searchLabel}</FieldLabel>
              <div className="relative">
                <SearchIcon
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
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
        </div>
        <div ref={resultsStartRef} className="-mt-4 flex scroll-mt-28 items-center justify-between gap-3 text-sm">
          <p aria-live="polite" className="text-muted-foreground">
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
              <nav
                aria-label={dict.catalogue.paginationLabel}
                className="flex flex-wrap items-center justify-center gap-2 border-t border-border pt-6"
              >
                <Button variant="outline" onClick={() => goToPage(cataloguePage.page - 1)} disabled={cataloguePage.page === 1}>
                  {dict.catalogue.previousPage}
                </Button>
                <div
                  className="flex items-center gap-1"
                  aria-label={dict.catalogue.pageLabel(cataloguePage.page, cataloguePage.totalPages)}
                >
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
    </div>
  )
}
