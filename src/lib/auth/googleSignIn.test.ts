import { describe, expect, it } from 'vitest'

import { parseGoogleUserInfo, readGoogleSignInConfig } from '@/lib/auth/googleSignIn'

describe('readGoogleSignInConfig', () => {
  it('refuses to boot when neither variable is set — there is no local-only fallback left', () => {
    expect(() => readGoogleSignInConfig({})).toThrow(/GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET/)
  })

  it('reads a fully configured client', () => {
    expect(readGoogleSignInConfig({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret' })).toEqual({
      clientId: 'id',
      clientSecret: 'secret',
    })
  })

  it('refuses a half-configured client, naming what is missing', () => {
    expect(() => readGoogleSignInConfig({ GOOGLE_CLIENT_ID: 'id' })).toThrow(/GOOGLE_CLIENT_SECRET/)
  })

  it('treats an empty value as unset', () => {
    expect(() => readGoogleSignInConfig({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: '' })).toThrow(/GOOGLE_CLIENT_SECRET/)
  })
})

describe('parseGoogleUserInfo', () => {
  it('extracts only the email from a verified response', () => {
    expect(parseGoogleUserInfo({ email: 'ramhalcom@gmail.com', email_verified: true, name: 'סוד', picture: 'https://…' })).toEqual({
      email: 'ramhalcom@gmail.com',
    })
  })

  it('refuses an unverified email', () => {
    expect(() => parseGoogleUserInfo({ email: 'ramhalcom@gmail.com', email_verified: false })).toThrow(/not verified/)
  })

  it('refuses a response with no email_verified field at all', () => {
    expect(() => parseGoogleUserInfo({ email: 'ramhalcom@gmail.com' })).toThrow(/not verified/)
  })

  it('refuses a response missing an email', () => {
    expect(() => parseGoogleUserInfo({ email_verified: true })).toThrow(/no email/)
  })
})
