import { adminListFilterHref } from './adminListFilters.ts'

const BOOKS_LIST_PATH = '/admin/collections/books'

type ListFilter = { label: string; href: string }

/**
 * `needsReview` is true on nearly every imported row, so it is noise as a
 * default column (docs/tasks/TASK-32-admin-facelift.md §4) — this is where
 * it actually lives instead: a one-click filtered view, the same mechanism
 * already proven on Orders (src/lib/orderListFilters.ts).
 */
export const BOOK_LIST_FILTERS: ListFilter[] = [
  { label: 'כל הספרים', href: BOOKS_LIST_PATH },
  { label: 'דורש בדיקה', href: adminListFilterHref(BOOKS_LIST_PATH, [['needsReview', 'equals', 'true']]) },
  { label: 'חסרה עטיפה', href: adminListFilterHref(BOOKS_LIST_PATH, [['cover', 'exists', 'false']]) },
]
