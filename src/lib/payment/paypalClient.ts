import 'server-only'

import type { Currency } from '@/lib/currency'
import type { PayPalConfig } from '@/lib/payment/paypalConfig'

/**
 * Thin wrappers over PayPal's REST API — every call here maps to exactly one
 * documented endpoint, nothing batched or cached beyond what's noted. Kept
 * separate from paypalProvider.ts so the request/response shapes are the
 * only thing that changes if PayPal's API does.
 */

export class PayPalApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message)
  }
}

async function paypalFetch(config: PayPalConfig, path: string, init: RequestInit & { accessToken?: string }): Promise<unknown> {
  const { accessToken, headers, ...rest } = init
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new PayPalApiError(`PayPal ${path} returned ${response.status}`, response.status, body)
  }
  return body
}

/**
 * Client-credentials OAuth2 grant. Fetched fresh per call rather than cached
 * — PayPal's tokens last hours and this adapter's call volume is a handful
 * of requests per order, so the extra round trip is not worth the
 * complexity of a cache that can serve a stale, revoked token.
 */
export async function getAccessToken(config: PayPalConfig): Promise<string> {
  const body = (await paypalFetch(config, '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })) as { access_token?: string }

  if (!body.access_token) throw new Error('PayPal token response had no access_token.')
  return body.access_token
}

export type PayPalOrder = {
  id: string
  links: { href: string; rel: string }[]
  purchase_units?: { payments?: { captures?: { id: string; status: string }[] } }[]
  status: string
}

export async function createOrder(
  config: PayPalConfig,
  accessToken: string,
  params: { amount: { currency_code: Currency; value: string }; returnUrl: string; locale: string },
): Promise<PayPalOrder> {
  return (await paypalFetch(config, '/v2/checkout/orders', {
    method: 'POST',
    accessToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: params.amount }],
      application_context: {
        brand_name: 'מכון רמח״ל',
        locale: params.locale,
        // Both approve and cancel land on the same URL — see
        // docs/tasks/TASK-26-paypal-adapter.md for why: confirmPayment asks
        // PayPal what happened rather than trusting which link was clicked.
        return_url: params.returnUrl,
        cancel_url: params.returnUrl,
        user_action: 'PAY_NOW',
      },
    }),
  })) as PayPalOrder
}

export async function getOrder(config: PayPalConfig, accessToken: string, orderId: string): Promise<PayPalOrder> {
  return (await paypalFetch(config, `/v2/checkout/orders/${orderId}`, { method: 'GET', accessToken })) as PayPalOrder
}

/**
 * Throws PayPalApiError on a refused capture (e.g. sandbox negative testing
 * — docs/reports/TASK-26.md) rather than returning a capture object, since
 * PayPal itself returns an HTTP error with no capture id in that case.
 */
export async function captureOrder(config: PayPalConfig, accessToken: string, orderId: string): Promise<PayPalOrder> {
  return (await paypalFetch(config, `/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    accessToken,
    headers: { 'Content-Type': 'application/json' },
  })) as PayPalOrder
}

export type WebhookVerificationRequest = {
  authAlgo: string
  certUrl: string
  transmissionId: string
  transmissionSig: string
  transmissionTime: string
  webhookEvent: unknown
}

/**
 * PayPal's own recommended verification method — an API call, not hand-rolled
 * RSA signature checking against the downloaded cert. `SUCCESS` is the only
 * value that means the request really came from PayPal.
 */
export async function verifyWebhookSignature(config: PayPalConfig, accessToken: string, request: WebhookVerificationRequest): Promise<boolean> {
  const body = (await paypalFetch(config, '/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    accessToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: request.authAlgo,
      cert_url: request.certUrl,
      transmission_id: request.transmissionId,
      transmission_sig: request.transmissionSig,
      transmission_time: request.transmissionTime,
      webhook_id: config.webhookId,
      webhook_event: request.webhookEvent,
    }),
  })) as { verification_status?: string }

  return body.verification_status === 'SUCCESS'
}
