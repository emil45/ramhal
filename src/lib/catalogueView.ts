import { selectPrice } from '@/lib/price'

import type { Currency } from '@/lib/currency'
import type { Locale } from '@/lib/locale'

export const CATALOGUE_SORTS = ['default', 'title', 'price-ascending', 'price-descending'] as const

export type CatalogueSort = (typeof CATALOGUE_SORTS)[number]

export function isCatalogueSort(value: string): value is CatalogueSort {
  return CATALOGUE_SORTS.some((sort) => sort === value)
}

type SortableCatalogueEntry = {
  prices: { amount: number; currency: string }[]
  title: string
}

/** User-selected ordering applied after the catalogue's default editorial
 * order. Missing prices always stay at the end; they must not masquerade as
 * zero-priced books in either direction. */
export function sortCatalogueView<T extends SortableCatalogueEntry>(
  entries: T[],
  sort: CatalogueSort,
  currency: Currency,
  locale: Locale,
): T[] {
  if (sort === 'default') return entries

  const collator = new Intl.Collator(locale, { sensitivity: 'base' })

  return [...entries].sort((a, b) => {
    if (sort === 'title') return collator.compare(a.title, b.title)

    const aPrice = selectPrice(a, currency)
    const bPrice = selectPrice(b, currency)
    if (aPrice === null && bPrice === null) return collator.compare(a.title, b.title)
    if (aPrice === null) return 1
    if (bPrice === null) return -1

    const difference = sort === 'price-ascending' ? aPrice - bPrice : bPrice - aPrice
    return difference || collator.compare(a.title, b.title)
  })
}

export type CataloguePage<T> = {
  end: number
  items: T[]
  page: number
  start: number
  totalItems: number
  totalPages: number
}

/** Slice a filtered catalogue into a safe page. Empty lists still report page
 * 1 of 1, and stale page numbers are clamped after filters reduce the result. */
export function paginateCatalogue<T>(items: T[], requestedPage: number, pageSize: number): CataloguePage<T> {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('Catalogue page size must be a positive integer.')

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safeRequestedPage = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1
  const page = Math.min(Math.max(safeRequestedPage, 1), totalPages)
  const offset = (page - 1) * pageSize
  const pageItems = items.slice(offset, offset + pageSize)

  return {
    end: pageItems.length === 0 ? 0 : offset + pageItems.length,
    items: pageItems,
    page,
    start: pageItems.length === 0 ? 0 : offset + 1,
    totalItems: items.length,
    totalPages,
  }
}
