// Two different facts about an order, never one field: "payment received" and
// "posted" are independent in the institute's real workflow
// (docs/DECISIONS.md §16).
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'cancelled'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const FULFILMENT_STATUSES = ['new', 'packed', 'posted', 'collected'] as const
export type FulfilmentStatus = (typeof FULFILMENT_STATUSES)[number]

/** Fulfilment states in which a paid order still needs someone to act on it —
 * the son's daily "paid, not yet posted" list. `collected` is the pickup
 * equivalent of `posted`, so neither belongs here. */
export const FULFILMENT_OUTSTANDING_STATUSES: readonly FulfilmentStatus[] = ['new', 'packed']

// Kept beside the option lists (not duplicated in the collection config and
// the list-view badge component) so a new status cannot be added in one
// place and forgotten in the other.
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'ממתין לתשלום',
  paid: 'שולם',
  failed: 'התשלום נכשל',
  cancelled: 'בוטל',
}

export const FULFILMENT_STATUS_LABELS: Record<FulfilmentStatus, string> = {
  new: 'חדשה',
  packed: 'ארוזה',
  posted: 'נשלחה',
  collected: 'נאספה',
}
