import { describe, expect, it } from 'vitest'

import { readGrowConfig } from '@/lib/payment/growConfig'

const COMPLETE_ENV = {
  GROW_CREATE_PAYMENT_URL: 'https://hook.eu1.make.com/create',
  GROW_PAYMENT_STATUS_URL: 'https://hook.eu1.make.com/status',
  GROW_WEBHOOK_SECRET: 'shared-secret',
  GROW_VAT_TYPE: 'exempt',
  SERVER_URL: 'https://www.ramhal.com',
}

describe('readGrowConfig', () => {
  it('reads a complete configuration', () => {
    expect(readGrowConfig(COMPLETE_ENV)).toEqual({
      createPaymentUrl: 'https://hook.eu1.make.com/create',
      paymentStatusUrl: 'https://hook.eu1.make.com/status',
      webhookSecret: 'shared-secret',
      vatType: 'exempt',
      siteUrl: 'https://www.ramhal.com',
    })
  })

  it('names every missing variable at once', () => {
    expect(() => readGrowConfig({ ...COMPLETE_ENV, GROW_WEBHOOK_SECRET: undefined, GROW_VAT_TYPE: '' })).toThrow(
      /GROW_WEBHOOK_SECRET, GROW_VAT_TYPE not set/,
    )
  })

  it('rejects a VAT type Grow has no equivalent for', () => {
    expect(() => readGrowConfig({ ...COMPLETE_ENV, GROW_VAT_TYPE: 'zero' })).toThrow(/GROW_VAT_TYPE must be one of regular, exempt/)
  })

  it('rejects a gateway address that is not https, since the shared secret travels in its header', () => {
    expect(() => readGrowConfig({ ...COMPLETE_ENV, GROW_CREATE_PAYMENT_URL: 'http://hook.example/create' })).toThrow(
      /GROW_CREATE_PAYMENT_URL must be an https/,
    )
  })
})
