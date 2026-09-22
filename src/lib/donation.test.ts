import { describe, expect, it } from 'vitest'

import { parsePaypalDonationUrl } from '@/lib/donation'

describe('parsePaypalDonationUrl', () => {
  it('uses the placeholder state when no link has been configured', () => {
    expect(parsePaypalDonationUrl(undefined)).toBeNull()
    expect(parsePaypalDonationUrl('   ')).toBeNull()
  })

  it('accepts secure PayPal donation destinations', () => {
    expect(parsePaypalDonationUrl('https://www.paypal.com/donate/?hosted_button_id=example')).toBe(
      'https://www.paypal.com/donate/?hosted_button_id=example',
    )
    expect(parsePaypalDonationUrl('https://paypal.me/machonramhal')).toBe('https://paypal.me/machonramhal')
  })

  it('rejects insecure or unrelated destinations', () => {
    expect(() => parsePaypalDonationUrl('http://paypal.com/donate')).toThrow(/HTTPS/)
    expect(() => parsePaypalDonationUrl('https://paypal.com.example.org/donate')).toThrow(/paypal\.com/)
    expect(() => parsePaypalDonationUrl('not a URL')).toThrow(/valid HTTPS/)
  })
})
