import { FULFILMENT_OUTSTANDING_STATUSES } from './orderStatus.ts'

const ORDERS_LIST_PATH = '/admin/collections/orders'

type ListFilter = { label: string; href: string }

function listHref(conditions: [field: string, operator: string, value: string][]): string {
  const query = new URLSearchParams()
  conditions.forEach(([field, operator, value], index) => {
    query.set(`where[and][${index}][${field}][${operator}]`, value)
  })
  return `${ORDERS_LIST_PATH}?${query}`
}

/**
 * The order list's one-click views, as links into Payload's own list
 * filtering. "Paid, not yet posted" is the son's daily job — every order he
 * can act on and none he cannot.
 */
export const ORDER_LIST_FILTERS: ListFilter[] = [
  { label: 'כל ההזמנות', href: ORDERS_LIST_PATH },
  {
    label: 'שולם, טרם נשלח',
    href: listHref([
      ['paymentStatus', 'equals', 'paid'],
      ['fulfilmentStatus', 'in', FULFILMENT_OUTSTANDING_STATUSES.join(',')],
    ]),
  },
  { label: 'ממתין לתשלום', href: listHref([['paymentStatus', 'equals', 'pending']]) },
]
