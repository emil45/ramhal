import 'server-only'

import { GROW_WEBHOOK_SECRET_HEADER } from '@/lib/payment/growConfig'

import type { GrowConfig } from '@/lib/payment/growConfig'

export class GrowGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message)
  }
}

// Make answers a webhook only after the whole scenario has run, including
// Grow's own call. Checkout waits on this, so a stuck scenario must fail the
// order placement within seconds rather than hang the customer's browser.
const GATEWAY_TIMEOUT_MILLISECONDS = 20_000

/**
 * One call to a Make scenario that answers over the webhook. Kept apart from
 * growProvider.ts, like paypalClient.ts, so the transport is the only thing
 * that changes if the scenarios are ever replaced by Grow's own API.
 */
export async function postToGrowGateway(config: GrowConfig, url: string, body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [GROW_WEBHOOK_SECRET_HEADER]: config.webhookSecret },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MILLISECONDS),
  })

  const responseBody = await response.json().catch(() => null)
  if (!response.ok) throw new GrowGatewayError(`Grow gateway ${url} returned ${response.status}`, response.status, responseBody)
  return responseBody
}
