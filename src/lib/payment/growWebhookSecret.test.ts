import { describe, expect, it } from 'vitest'

import { isValidWebhookSecret } from '@/lib/payment/growWebhookSecret'

describe('isValidWebhookSecret', () => {
  it('accepts the shared secret', () => {
    expect(isValidWebhookSecret('shared-secret', 'shared-secret')).toBe(true)
  })

  it.each([
    ['a different secret', 'other-secret'],
    ['a prefix of it', 'shared'],
    ['an extension of it', 'shared-secret-and-more'],
    ['an empty one', ''],
  ])('refuses %s', (_label, received) => {
    expect(isValidWebhookSecret(received, 'shared-secret')).toBe(false)
  })

  it('refuses a call that sent no secret at all', () => {
    expect(isValidWebhookSecret(null, 'shared-secret')).toBe(false)
  })
})
