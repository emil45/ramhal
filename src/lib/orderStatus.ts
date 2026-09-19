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
