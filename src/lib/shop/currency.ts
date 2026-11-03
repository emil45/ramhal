// The three currencies the catalogue prices in. Shared between books (per-book
// prices) and shipping settings (per-zone currency) so the two can never drift.
export const CURRENCIES = ['ILS', 'EUR', 'USD'] as const

export type Currency = (typeof CURRENCIES)[number]
