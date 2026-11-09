import { parseServerUrl } from '@/lib/platform/serverUrl'

export const GROW_VAT_TYPES = ['regular', 'exempt'] as const
export type GrowVatType = (typeof GROW_VAT_TYPES)[number]

/** The header Make's scenarios and this site use to prove a call is theirs. */
export const GROW_WEBHOOK_SECRET_HEADER = 'x-ramhal-webhook-secret'

export type GrowConfig = {
  /** Make webhook that creates a payment link and answers with its address. */
  createPaymentUrl: string
  /** Make webhook that answers with the state of one payment link. */
  paymentStatusUrl: string
  webhookSecret: string
  vatType: GrowVatType
  /** This site's own public address, which Grow's payment page returns to. */
  siteUrl: string
}

const VARIABLE_NAMES = ['GROW_CREATE_PAYMENT_URL', 'GROW_PAYMENT_STATUS_URL', 'GROW_WEBHOOK_SECRET', 'GROW_VAT_TYPE', 'SERVER_URL'] as const

/**
 * All variables are required together, the same all-or-none pattern as
 * paypalConfig.ts, so a half-configured Grow fails at boot and not at the
 * first checkout. Grow is reached through Make scenarios (docs/grow-make-scenarios.md),
 * not Grow's own API, so there is no Grow account credential here — Make holds it.
 * `GROW_VAT_TYPE` is the institute's VAT status at Grow, which Grow requires on every product.
 */
export function readGrowConfig(env: Record<string, string | undefined>): GrowConfig {
  const missing = VARIABLE_NAMES.filter((name) => !env[name])
  if (missing.length > 0) {
    throw new Error(`Grow is not fully configured: ${missing.join(', ')} not set. See .env.example.`)
  }

  const vatType = env.GROW_VAT_TYPE as string
  if (!isGrowVatType(vatType)) {
    throw new Error(`GROW_VAT_TYPE must be one of ${GROW_VAT_TYPES.join(', ')}; got "${vatType}".`)
  }

  return {
    createPaymentUrl: requireHttps('GROW_CREATE_PAYMENT_URL', env.GROW_CREATE_PAYMENT_URL as string),
    paymentStatusUrl: requireHttps('GROW_PAYMENT_STATUS_URL', env.GROW_PAYMENT_STATUS_URL as string),
    webhookSecret: env.GROW_WEBHOOK_SECRET as string,
    vatType,
    siteUrl: parseServerUrl(env.SERVER_URL as string),
  }
}

function isGrowVatType(value: string): value is GrowVatType {
  return (GROW_VAT_TYPES as readonly string[]).includes(value)
}

function requireHttps(name: string, value: string): string {
  if (!value.startsWith('https://')) throw new Error(`${name} must be an https:// address; got "${value}".`)
  return value
}
