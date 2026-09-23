import { formatPrice } from '../../lib/price.ts'

import type { DefaultCellComponentProps } from 'payload'
import type { Currency } from '../../lib/currency.ts'

type PriceRow = { amount?: number; currency?: string }

/** Every price a book carries, formatted — "₪55.00 · €15.00" — instead of
 * the default array column's bare row count. */
export function PriceList({ rowData }: DefaultCellComponentProps) {
  const prices = (rowData?.prices ?? []) as PriceRow[]
  const formatted = prices
    .filter((price): price is Required<PriceRow> => typeof price.amount === 'number' && typeof price.currency === 'string')
    .map((price) => formatPrice(price.amount, price.currency as Currency, 'he'))

  // elevation-400 on paper measures 2.53:1 — well below WCAG AA's 4.5:1
  // (checked directly, not eyeballed). elevation-700 measures 8.85:1.
  if (formatted.length === 0) return <span style={{ color: 'var(--theme-elevation-700)' }}>—</span>
  return <span>{formatted.join(' · ')}</span>
}
