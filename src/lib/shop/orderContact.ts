type Customer = { name?: string | null; phone?: string | null }

/**
 * The customer's name and phone as top-level values, for the places Payload
 * only reads a top-level field: the document title, the list's search box and
 * its sortable columns. Nothing edits them; they are rewritten from the
 * customer group on every save that carries one, so they cannot drift.
 * A save that carries no customer (a payment or fulfilment update) leaves them alone.
 */
export function orderContactFields(customer: Customer | undefined): { contactName?: string; contactPhone?: string } {
  if (!customer) return {}
  return {
    ...(customer.name != null && { contactName: customer.name }),
    ...(customer.phone != null && { contactPhone: customer.phone }),
  }
}
