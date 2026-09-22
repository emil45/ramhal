/**
 * A link into one of Payload's own list views, pre-filtered — the query
 * string shape Payload's `where` parser expects. Shared by the order and
 * book quick-filter links (src/lib/orderListFilters.ts,
 * src/lib/bookListFilters.ts) and the dashboard (src/components/admin/Dashboard.tsx),
 * which all build the same shape of link into a different collection.
 */
export function adminListFilterHref(collectionPath: string, conditions: [field: string, operator: string, value: string][]): string {
  const query = new URLSearchParams()
  conditions.forEach(([field, operator, value], index) => {
    query.set(`where[and][${index}][${field}][${operator}]`, value)
  })
  return `${collectionPath}?${query}`
}
