import { QuickFilters } from './QuickFilters.tsx'
import { BOOK_LIST_FILTERS } from '../../lib/bookListFilters.ts'

/** One-click views above the books list — see BOOK_LIST_FILTERS. */
export function BookQuickFilters() {
  return <QuickFilters filters={BOOK_LIST_FILTERS} />
}
