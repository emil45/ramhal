import { afterEach, describe, expect, it, vi } from 'vitest'

import { assertBuiltForRunningEnvironment, parseAppEnvironment, readAppEnvironment } from '@/lib/appEnvironment'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('parseAppEnvironment', () => {
  it.each(['development', 'demo', 'production'])('accepts %s', (name) => {
    expect(parseAppEnvironment(name)).toBe(name)
  })

  it.each([undefined, '', 'staging', 'Production', 'prod'])('refuses %s rather than guessing', (value) => {
    expect(() => parseAppEnvironment(value)).toThrow(/APP_ENV/)
  })
})

describe('readAppEnvironment', () => {
  it('reads APP_ENV, not NODE_ENV', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('APP_ENV', 'demo')

    expect(readAppEnvironment()).toBe('demo')
  })
})

describe('assertBuiltForRunningEnvironment', () => {
  it('accepts a build that matches the environment it runs in', () => {
    expect(() => assertBuiltForRunningEnvironment('demo', 'demo')).not.toThrow()
  })

  it.each([
    ['development', 'demo'],
    ['production', 'demo'],
    ['demo', 'production'],
  ] as const)('refuses a build made for %s running as %s, saying to rebuild', (builtFor, running) => {
    expect(() => assertBuiltForRunningEnvironment(builtFor, running)).toThrow(/next build. again/)
  })

  it('refuses a build that recorded no environment', () => {
    expect(() => assertBuiltForRunningEnvironment(undefined, 'demo')).toThrow(/unset/)
  })
})
