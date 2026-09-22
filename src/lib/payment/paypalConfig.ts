export const PAYPAL_ENVIRONMENTS = ['sandbox', 'live'] as const
export type PayPalEnvironment = (typeof PAYPAL_ENVIRONMENTS)[number]

export type PayPalConfig = {
  apiBaseUrl: string
  clientId: string
  clientSecret: string
  webhookId: string
}

const API_BASE_URL: Record<PayPalEnvironment, string> = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
}

const VARIABLE_NAMES = ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID', 'PAYPAL_ENV'] as const

/**
 * All four PayPal variables are required together, the same all-or-none
 * pattern as googleSignIn.ts — a half-configured PayPal adapter would
 * otherwise fail at the first real request instead of at boot. `PAYPAL_ENV`
 * decides sandbox vs. live independently of `APP_ENV`: `APP_ENV` says which
 * deployment this is (docs/DECISIONS.md §18), not which PayPal credentials a
 * given deployment happens to hold, and this task only ever sets it to
 * `sandbox` (docs/tasks/TASK-26-paypal-adapter.md — live credentials are out
 * of scope here).
 */
export function readPayPalConfig(env: Record<string, string | undefined>): PayPalConfig {
  const missing = VARIABLE_NAMES.filter((name) => !env[name])
  if (missing.length > 0) {
    throw new Error(`PayPal is not fully configured: ${missing.join(', ')} not set. See .env.example.`)
  }

  const environment = env.PAYPAL_ENV as string
  if (!isPayPalEnvironment(environment)) {
    throw new Error(`PAYPAL_ENV must be one of ${PAYPAL_ENVIRONMENTS.join(', ')}; got "${environment}".`)
  }

  return {
    apiBaseUrl: API_BASE_URL[environment],
    clientId: env.PAYPAL_CLIENT_ID as string,
    clientSecret: env.PAYPAL_CLIENT_SECRET as string,
    webhookId: env.PAYPAL_WEBHOOK_ID as string,
  }
}

function isPayPalEnvironment(value: string): value is PayPalEnvironment {
  return (PAYPAL_ENVIRONMENTS as readonly string[]).includes(value)
}
