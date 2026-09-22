import { QuickFilters } from './QuickFilters.tsx'
import { ORDER_LIST_FILTERS } from '../../lib/orderListFilters.ts'

/** One-click views above the orders list — see ORDER_LIST_FILTERS. */
export function OrderQuickFilters() {
  return <QuickFilters filters={ORDER_LIST_FILTERS} />
}
