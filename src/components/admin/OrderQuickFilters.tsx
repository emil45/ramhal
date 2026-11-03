import { QuickFilters } from './QuickFilters.tsx'
import { ORDER_LIST_FILTERS } from '../../lib/admin/orderListFilters.ts'

import type { ListViewServerProps } from 'payload'

/** One-click views above the orders list — see ORDER_LIST_FILTERS. */
export function OrderQuickFilters({ searchParams }: ListViewServerProps) {
  return <QuickFilters filters={ORDER_LIST_FILTERS} searchParams={searchParams} />
}
