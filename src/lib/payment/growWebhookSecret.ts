import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Whether the secret a caller sent is ours. Compared as equal-length digests
 * in constant time, so the response time never tells a caller how much of a
 * guess was right, and no length check reveals how long the secret is.
 */
export function isValidWebhookSecret(received: string | null, expected: string): boolean {
  if (received === null) return false
  return timingSafeEqual(digest(received), digest(expected))
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}
