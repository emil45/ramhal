import { QuickFilters } from './QuickFilters.tsx'
import { BOOK_LIST_FILTERS } from '../../lib/bookListFilters.ts'

import type { ListViewServerProps } from 'payload'

/** One-click views above the books list — see BOOK_LIST_FILTERS. */
export function BookQuickFilters({ searchParams }: ListViewServerProps) {
  return <QuickFilters filters={BOOK_LIST_FILTERS} searchParams={searchParams} />
}
