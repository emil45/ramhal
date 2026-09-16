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
