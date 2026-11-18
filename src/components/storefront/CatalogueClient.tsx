'use client'

import { SearchIcon, SearchXIcon, SlidersHorizontal } from 'lucide-react'
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

const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-7 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-9'
const SKELETON_CARD_COUNT = 8
const BOOKS_PER_PAGE = 20

const BOOK_LANGUAGES = ['he', 'fr', 'en', 'he-fr', 'aramaic-fr', 'unknown'] as const
type BookLanguageFilter = '' | (typeof BOOK_LANGUAGES)[number]

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
  const [bookLanguage, setBookLanguage] = useState<BookLanguageFilter>(defaultLanguage)
  const [sort, setSort] = useState<CatalogueSort>('default')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const resultsStartRef = useRef<HTMLDivElement>(null)

  // filterCatalogue matches on `title` — explicitly the resolved
  // displayTitle, not Book's own possibly-blank per-locale `title` (see
  // lib/booksData.ts), otherwise searching a book with no title in this
  // locale crashes normalizeForSearch on undefined.
  const entries = useMemo(
    () =>
      shelfBooks.map((book) => ({
        ...book,
        categorySlug: book.category?.slug ?? null,
        title: book.displayTitle,
      })),
    [shelfBooks],
  )

  // Typing stays responsive while the list catches up; the skeleton below
  // covers the short gap in which the grid still shows the previous query.
  const deferredQuery = useDeferredValue(query)
  const isFiltering = query !== deferredQuery

  const filtered = useMemo(
    () =>
      filterCatalogue(entries, {
        categorySlug: categorySlug || null,
        bookLanguage: bookLanguage || null,
        query: deferredQuery,
      }),
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

  const hasFilters =
    query !== '' || categorySlug !== '' || bookLanguage !== defaultLanguage || sort !== 'default'

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

  // The empty string is "every language", as in the filter itself.
  const languageOptions: BookLanguageFilter[] = ['', ...languagesPresent]

  const languageCount = (language: string) =>
    entries.filter((entry) => !language || entry.bookLanguage === language).length

  const goToPage = (nextPage: number) => {
    setPage(nextPage)
    requestAnimationFrame(() => resultsStartRef.current?.scrollIntoView({ block: 'start' }))
  }

  return (
    <div className="flex flex-col">
      <header className="border-b border-border bg-paper-quiet">
        <div className="page-container grid items-end gap-4 py-5 sm:gap-5 sm:py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8">
          <div className="flex max-w-2xl flex-col gap-2">
            <h1 className="type-title">{dict.catalogue.title}</h1>
            <p className="max-w-xl text-base text-pretty text-muted-foreground">{dict.catalogue.intro}</p>
          </div>
          {shelves.length > 1 ? (
            <div
              role="group"
              aria-label={dict.catalogue.shelvesLabel}
              className="grid grid-cols-2 gap-2 sm:flex"
            >
              {shelves.map((option) => {
                const selected = option === shelf
                return (
                  <Button
                    key={option}
                    variant="ghost"
                    aria-pressed={selected}
                    onClick={() => chooseShelf(option)}
                    className={cn(
                      'h-auto min-h-12 min-w-0 border border-b-2 px-2 py-2.5 text-center text-sm leading-tight font-semibold whitespace-normal sm:px-5 md:px-6',
                      selected
                        ? 'border-border border-b-teal bg-study-paper text-teal-deep hover:bg-study-paper hover:text-teal-deep'
                        : 'border-border bg-background text-foreground hover:bg-secondary hover:text-teal-deep',
                    )}
                  >
                    {dict.catalogue.shelf[option]}
                  </Button>
                )
              })}
            </div>
          ) : null}
        </div>
      </header>

      <div className="page-container flex flex-col gap-4 pt-5 pb-12 sm:gap-5 lg:pt-8">
        <div className="catalogue-toolbar flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
          <div className="flex min-w-0 flex-1 items-end gap-2 lg:gap-0">
            <Field className="min-w-0">
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
            <Button
              variant="outline"
              className="min-h-13 px-3 lg:hidden"
              aria-expanded={filtersOpen}
              aria-controls="catalogue-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              {dict.catalogue.filtersLabel}
            </Button>
          </div>
          <div
            id="catalogue-filters"
            className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:gap-4', !filtersOpen && 'hidden')}
          >
            {languagesPresent.length > 1 ? (
              <Field className="min-w-0 lg:w-56">
                <FieldLabel htmlFor="catalogue-language">{dict.catalogue.languageLabel}</FieldLabel>
                <NativeSelect
                  id="catalogue-language"
                  value={bookLanguage}
                  onChange={(event) => {
                    setBookLanguage(languageOptions.find((language) => language === event.target.value) ?? '')
                    setPage(1)
                  }}
                  className="w-full"
                >
                  {languageOptions.map((language) => (
                    <NativeSelectOption key={language || 'all'} value={language}>
                      {language ? dict.bookLanguageLabel[language] : dict.catalogue.allLanguages}
                      {` (${languageCount(language)})`}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            ) : null}
            {hasCategoryFilter ? (
              <Field className="min-w-0 lg:w-52">
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
            <Field className="min-w-0 lg:w-52">
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
                <NativeSelectOption value="price-ascending">
                  {dict.catalogue.sortPriceAscending}
                </NativeSelectOption>
                <NativeSelectOption value="price-descending">
                  {dict.catalogue.sortPriceDescending}
                </NativeSelectOption>
              </NativeSelect>
            </Field>
          </div>
        </div>
        <div
          ref={resultsStartRef}
          className="flex min-h-10 scroll-mt-28 flex-wrap items-center justify-between gap-x-3 text-sm"
        >
          <p aria-live="polite" className="text-muted-foreground">
            {cataloguePage.totalItems > 0
              ? dict.catalogue.showingRange(cataloguePage.start, cataloguePage.end, cataloguePage.totalItems)
              : dict.catalogue.resultCount(0)}
            {languagesPresent.length > 1 && !filtersOpen ? (
              <span className="lg:hidden">
                {' · '}{bookLanguage ? dict.bookLanguageLabel[bookLanguage] : dict.catalogue.allLanguages}
              </span>
            ) : null}
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
                <Button
                  variant="outline"
                  onClick={() => goToPage(cataloguePage.page - 1)}
                  disabled={cataloguePage.page === 1}
                >
                  {dict.catalogue.previousPage}
                </Button>
                <div
                  className="flex items-center gap-1"
                  aria-label={dict.catalogue.pageLabel(cataloguePage.page, cataloguePage.totalPages)}
                >
                  {Array.from({ length: cataloguePage.totalPages }, (_, index) => index + 1).map(
                    (pageNumber) => (
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
                    ),
                  )}
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
