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

  it.each(['development', 'demo'] as const)('allows the mock provider when APP_ENV is %s', (appEnvironment) => {
    expect(() => assertProviderAllowedInEnvironment('mock', appEnvironment)).not.toThrow()
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

  it('refuses to hand out the mock when APP_ENV is production', () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'mock')
    vi.stubEnv('APP_ENV', 'production')

    expect(() => readPaymentProviderName()).toThrow(/Refusing to start/)
  })

  it('hands out the mock in a deployed demo, which is NODE_ENV=production but APP_ENV=demo', () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'mock')
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('APP_ENV', 'demo')

    expect(readPaymentProviderName()).toBe('mock')
  })

  it('refuses to start when APP_ENV is missing, rather than assuming it is safe', () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'mock')
    vi.stubEnv('APP_ENV', '')

    expect(() => readPaymentProviderName()).toThrow(/APP_ENV/)
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

  // The payment tests below choose APP_ENV per case; the build always matches it.
  function stubAppEnvironment(appEnvironment: string) {
    vi.stubEnv('APP_ENV', appEnvironment)
    vi.stubEnv('BUILT_FOR_APP_ENV', appEnvironment)
  }

  it('exits non-zero, saying why, when booting in production with the mock provider', async () => {
    stubAppEnvironment('production')
    const exit = stubExit()
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await register()

    expect(exit).toHaveBeenCalledWith(1)
    expect(stderr).toHaveBeenCalledWith(expect.stringMatching(/Refusing to start.*mock/i))
  })

  it('boots in development with the mock provider', async () => {
    stubAppEnvironment('development')
    const exit = stubExit()

    await register()

    expect(exit).not.toHaveBeenCalled()
  })

  it('boots a deployed demo: NODE_ENV=production, APP_ENV=demo, mock provider', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    stubAppEnvironment('demo')
    const exit = stubExit()

    await register()

    expect(exit).not.toHaveBeenCalled()
  })

  it('does not block `next build`, which also runs with NODE_ENV=production', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    stubAppEnvironment('production')
    const exit = stubExit()

    await register()

    expect(exit).not.toHaveBeenCalled()
  })

  it('exits non-zero, saying to rebuild, when the build was made for a different APP_ENV', async () => {
    vi.stubEnv('APP_ENV', 'demo')
    vi.stubEnv('BUILT_FOR_APP_ENV', 'development')
    const exit = stubExit()
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await register()

    expect(exit).toHaveBeenCalledWith(1)
    expect(stderr).toHaveBeenCalledWith(expect.stringMatching(/next build. again/i))
  })
})
