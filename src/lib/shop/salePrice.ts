import { selectPrice } from './price.ts'

import type { Currency } from '@/lib/shop/currency'

type SalePricedItem = {
  prices: { amount: number; compareAtAmount?: number | null; currency: string }[]
}

export type Sale = {
  amount: number
  compareAtAmount: number
  percentOff: number
}

/**
 * A book is on sale in a currency when its editor has recorded a higher
 * "before" price beside the price it actually sells at. The sale price is
 * always `amount` — what the cart and the order charge — so a sale never
 * touches pricing; the earlier price is only shown, crossed out. A "before"
 * price at or below the selling price is no sale, and says nothing.
 */
export function selectSale(item: SalePricedItem, currency: Currency): Sale | null {
  const amount = selectPrice(item, currency)
  const compareAtAmount = item.prices.find((price) => price.currency === currency)?.compareAtAmount
  if (amount === null || typeof compareAtAmount !== 'number' || compareAtAmount <= amount) return null

  return { amount, compareAtAmount, percentOff: Math.round((1 - amount / compareAtAmount) * 100) }
}
