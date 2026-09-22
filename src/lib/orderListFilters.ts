import { adminListFilterHref } from './adminListFilters.ts'
import { FULFILMENT_OUTSTANDING_STATUSES } from './orderStatus.ts'

const ORDERS_LIST_PATH = '/admin/collections/orders'

type ListFilter = { label: string; href: string }

/**
 * The order list's one-click views, as links into Payload's own list
 * filtering. "Paid, not yet posted" is the son's daily job — every order he
 * can act on and none he cannot.
 */
export const ORDER_LIST_FILTERS: ListFilter[] = [
  { label: 'כל ההזמנות', href: ORDERS_LIST_PATH },
  {
    label: 'שולם, טרם נשלח',
    href: adminListFilterHref(ORDERS_LIST_PATH, [
      ['paymentStatus', 'equals', 'paid'],
      ['fulfilmentStatus', 'in', FULFILMENT_OUTSTANDING_STATUSES.join(',')],
    ]),
  },
  { label: 'ממתין לתשלום', href: adminListFilterHref(ORDERS_LIST_PATH, [['paymentStatus', 'equals', 'pending']]) },
]
