import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { register } from '@/instrumentation'
import { assertProviderAllowedInEnvironment, readPaymentProviderName } from '@/lib/payment/paymentConfiguration'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('assertProviderAllowedInEnvironment', () => {
  it('refuses the mock provider in production, saying why', () => {
    expect(() => assertProviderAllowedInEnvironment('mock', 'production')).toThrow(/mock.*production|production.*mock/i)
  })

  it.each(['development', 'test', undefined])('allows the mock provider when NODE_ENV is %s', (nodeEnv) => {
    expect(() => assertProviderAllowedInEnvironment('mock', nodeEnv)).not.toThrow()
  })

  it('allows a real provider in production', () => {
    expect(() => assertProviderAllowedInEnvironment('paypal', 'production')).not.toThrow()
  })
})

describe('readPaymentProviderName', () => {
  it('fails when no provider is configured', () => {
    vi.stubEnv('PAYMENT_PROVIDER', '')

    expect(() => readPaymentProviderName()).toThrow(/PAYMENT_PROVIDER/)
  })

  it('refuses to hand out the mock when NODE_ENV is production', () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'mock')
    vi.stubEnv('NODE_ENV', 'production')

    expect(() => readPaymentProviderName()).toThrow(/Refusing to start/)
  })
})

// The server's startup hook is what makes "refuses to start" true: register()
// runs before the server accepts a request. It must end the process, because
// `next start` survives a throw from it and serves 500s.
describe('server startup (instrumentation register)', () => {
  function stubExit() {
    return vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
  }

  beforeEach(() => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs')
    vi.stubEnv('PAYMENT_PROVIDER', 'mock')
  })

  it('exits non-zero, saying why, when booting in production with the mock provider', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const exit = stubExit()
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await register()

    expect(exit).toHaveBeenCalledWith(1)
    expect(stderr).toHaveBeenCalledWith(expect.stringMatching(/Refusing to start.*mock/i))
  })

  it('boots in development with the mock provider', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const exit = stubExit()

    await register()

    expect(exit).not.toHaveBeenCalled()
  })

  it('does not block `next build`, which also runs with NODE_ENV=production', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    vi.stubEnv('NODE_ENV', 'production')
    const exit = stubExit()

    await register()

    expect(exit).not.toHaveBeenCalled()
  })
})
