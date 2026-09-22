import { number } from 'payload/shared'

import type { NumberFieldValidation } from 'payload'

/**
 * Postgres's `numeric` column (what Payload's `number` field maps to) accepts
 * any number of decimal places with no schema-level way to cap it, so money
 * fields validate this themselves — the only way to actually enforce "never
 * more precise than the currency's own subunit" for values stored in major
 * units (shekels/dollars/euros).
 */
export function hasAtMostTwoDecimalPlaces(value: number | null | undefined): string | true {
  if (typeof value !== 'number') return true
  // Comparing rounded-to-cents against the raw value directly would reject a
  // valid amount that floating point cannot represent exactly (e.g. 19.1);
  // the epsilon absorbs that without also accepting a genuine third decimal.
  return Math.abs(Math.round(value * 100) - value * 100) < 1e-9
    ? true
    : 'Enter an amount with at most two decimal places.'
}

/**
 * The `validate` a money field actually configures. A bare custom `validate`
 * replaces Payload's own field validator entirely, so `min`/`required` stop
 * being enforced (see docs/reviews/REVIEW-01-findings.md #3) — this composes
 * Payload's default `number` validation with the decimal-places rule above
 * instead of standing in for it.
 */
export const validateMoneyAmount: NumberFieldValidation = (value, options) => {
  const numberResult = number(value, options)
  if (numberResult !== true) return numberResult
  return hasAtMostTwoDecimalPlaces(Array.isArray(value) ? undefined : value)
}
