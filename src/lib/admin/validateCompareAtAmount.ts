import { validateMoneyAmount } from './validateMoneyAmount.ts'

import type { NumberFieldValidation } from 'payload'

const NOT_HIGHER_MESSAGE = 'המחיר לפני המבצע חייב להיות גבוה מהמחיר בפועל. השאירו ריק אם אין מבצע.'

/** Whether a "before" price would actually show a sale beside `amount`. */
export function isHigherThanSellingPrice(compareAtAmount: number | null | undefined, amount: unknown): boolean {
  if (typeof compareAtAmount !== 'number') return true
  return typeof amount !== 'number' || compareAtAmount > amount
}

/**
 * The optional "before" price beside a book's price. Left empty there is no
 * sale; filled in it must be a valid money amount above the price the book
 * sells at, or the storefront would cross out a lower number.
 */
export const validateCompareAtAmount: NumberFieldValidation = (value, options) => {
  const moneyResult = validateMoneyAmount(value, options)
  if (moneyResult !== true) return moneyResult
  const siblingAmount: unknown = options.siblingData && 'amount' in options.siblingData ? options.siblingData.amount : undefined
  return isHigherThanSellingPrice(Array.isArray(value) ? undefined : value, siblingAmount) ? true : NOT_HIGHER_MESSAGE
}
