import { CURRENCIES } from '../shop/currency.ts'

// Payload hands an array field's rows to `validate` as unknown values.
function currencyOf(row: unknown): unknown {
  return typeof row === 'object' && row !== null && 'currency' in row ? row.currency : undefined
}

/**
 * A shipping tier is priced in the customer's currency, which follows the site
 * language and has nothing to do with the destination. A tier that skips a
 * currency would leave every customer of that language unable to ship to the
 * zone, so each currency must appear exactly once. The messages are Hebrew
 * because the son reads them in the admin.
 */
export function validateShippingAmounts(rows: readonly unknown[] | null | undefined): string | true {
  const currencies = (rows ?? []).map(currencyOf)

  const missing = CURRENCIES.filter((currency) => !currencies.includes(currency))
  if (missing.length > 0) return `חסר סכום משלוח במטבעות: ${missing.join(', ')}.`

  const repeated = CURRENCIES.filter((currency) => currencies.filter((entry) => entry === currency).length > 1)
  if (repeated.length > 0) return `מטבע מופיע יותר מפעם אחת: ${repeated.join(', ')}.`

  return true
}
