import { number } from 'payload/shared'

import type { NumberFieldValidation } from 'payload'

/**
 * Postgres's `numeric` column (what Payload's `number` field maps to) accepts
 * decimals with no schema-level way to forbid them, so money fields validate
 * integer-ness themselves — the only way to actually enforce "never a float"
 * for values stored in minor units (agorot/cents).
 */
export function validateIntegerAmount(value: number | null | undefined): string | true {
  if (typeof value !== 'number') return true
  return Number.isInteger(value) ? true : 'Enter a whole number of minor units (agorot/cents) — no decimals.'
}

/**
 * The `validate` a money field actually configures. A bare custom `validate`
 * replaces Payload's own field validator entirely, so `min`/`required` stop
 * being enforced (see docs/reviews/REVIEW-01-findings.md #3) — this composes
 * Payload's default `number` validation with the integer rule above instead
 * of standing in for it.
 */
export const validateMoneyAmount: NumberFieldValidation = (value, options) => {
  const numberResult = number(value, options)
  if (numberResult !== true) return numberResult
  return validateIntegerAmount(Array.isArray(value) ? undefined : value)
}
