import { afterEach, describe, expect, it, vi } from 'vitest'

import { isAdminAllowedEmail, parseAdminAllowedEmails, readAdminAllowedEmails } from '@/lib/auth/adminAllowlist'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('parseAdminAllowedEmails', () => {
  it('splits a comma-separated list, trimmed and lower-cased', () => {
    expect(parseAdminAllowedEmails(' Emil45@gmail.com ,ramhalcom@gmail.com')).toEqual(['emil45@gmail.com', 'ramhalcom@gmail.com'])
  })

  it.each([undefined, '', '   ', ','])('refuses %s rather than allowing everyone or no one', (value) => {
    expect(() => parseAdminAllowedEmails(value)).toThrow(/ADMIN_ALLOWED_EMAILS/)
  })
})

describe('readAdminAllowedEmails', () => {
  it('fails loudly when ADMIN_ALLOWED_EMAILS is unset, the failure mode that must never be silent', () => {
    vi.stubEnv('ADMIN_ALLOWED_EMAILS', undefined)

    expect(() => readAdminAllowedEmails()).toThrow(/ADMIN_ALLOWED_EMAILS/)
  })
})

describe('isAdminAllowedEmail', () => {
  const allowedEmails = ['emil45@gmail.com', 'ramhalcom@gmail.com']

  it('allows a listed email', () => {
    expect(isAdminAllowedEmail('ramhalcom@gmail.com', allowedEmails)).toBe(true)
  })

  it('compares case-insensitively', () => {
    expect(isAdminAllowedEmail('RamhalCom@Gmail.com', allowedEmails)).toBe(true)
  })

  it('compares whitespace-insensitively', () => {
    expect(isAdminAllowedEmail('  ramhalcom@gmail.com  ', allowedEmails)).toBe(true)
  })

  it('refuses an unlisted email', () => {
    expect(isAdminAllowedEmail('someone.else@gmail.com', allowedEmails)).toBe(false)
  })
})
