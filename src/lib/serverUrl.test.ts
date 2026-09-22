import { afterEach, describe, expect, it, vi } from 'vitest'

import { parseServerUrl, readServerUrl } from '@/lib/serverUrl'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('parseServerUrl', () => {
  it.each(['http://localhost:3000', 'https://ramhal-theta.vercel.app'])('accepts %s', (value) => {
    expect(parseServerUrl(value)).toBe(value)
  })

  it('refuses a value with no protocol', () => {
    expect(() => parseServerUrl('ramhal-theta.vercel.app')).toThrow(/http:\/\/ or https:\/\//)
  })

  it('refuses a trailing slash, which the OAuth plugin cannot append to', () => {
    expect(() => parseServerUrl('https://ramhal-theta.vercel.app/')).toThrow(/trailing slash/)
  })
})

describe('readServerUrl', () => {
  it('reads SERVER_URL from the environment', () => {
    vi.stubEnv('SERVER_URL', 'https://ramhal-theta.vercel.app')

    expect(readServerUrl()).toBe('https://ramhal-theta.vercel.app')
  })

  it('fails loudly when SERVER_URL is unset', () => {
    vi.stubEnv('SERVER_URL', undefined)

    expect(() => readServerUrl()).toThrow(/SERVER_URL/)
  })
})
