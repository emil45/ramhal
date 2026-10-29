import { QuickFilters } from './QuickFilters.tsx'
import { ORDER_LIST_FILTERS } from '../../lib/orderListFilters.ts'

import type { ListViewServerProps } from 'payload'

// Payload builds the search box's placeholder from top-level fields only, and the
// customer's details sit inside a group, so it would otherwise say "search by ID".
const SEARCH_HINT = 'אפשר לחפש לפי שם הלקוח, טלפון, דוא״ל או מספר הזמנה.'

/** One-click views above the orders list — see ORDER_LIST_FILTERS. */
export function OrderQuickFilters({ searchParams }: ListViewServerProps) {
  return <QuickFilters filters={ORDER_LIST_FILTERS} hint={SEARCH_HINT} searchParams={searchParams} />
}
