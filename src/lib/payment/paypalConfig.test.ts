import { describe, expect, it } from 'vitest'

import { readPayPalConfig } from '@/lib/payment/paypalConfig'

const FULL_ENV = {
  PAYPAL_CLIENT_ID: 'client-id',
  PAYPAL_CLIENT_SECRET: 'client-secret',
  PAYPAL_WEBHOOK_ID: 'webhook-id',
  PAYPAL_ENV: 'sandbox',
}

describe('readPayPalConfig', () => {
  it('reads a fully configured sandbox client', () => {
    expect(readPayPalConfig(FULL_ENV)).toEqual({
      apiBaseUrl: 'https://api-m.sandbox.paypal.com',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      webhookId: 'webhook-id',
    })
  })

  it('resolves the live API host for PAYPAL_ENV=live', () => {
    expect(readPayPalConfig({ ...FULL_ENV, PAYPAL_ENV: 'live' }).apiBaseUrl).toBe('https://api-m.paypal.com')
  })

  it('refuses a half-configured client, naming what is missing', () => {
    expect(() => readPayPalConfig({ ...FULL_ENV, PAYPAL_CLIENT_SECRET: undefined })).toThrow(/PAYPAL_CLIENT_SECRET/)
  })

  it('refuses when nothing is set', () => {
    expect(() => readPayPalConfig({})).toThrow(/PAYPAL_CLIENT_ID/)
  })

  it('refuses an unrecognised PAYPAL_ENV rather than silently defaulting', () => {
    expect(() => readPayPalConfig({ ...FULL_ENV, PAYPAL_ENV: 'staging' })).toThrow(/PAYPAL_ENV/)
  })
})
