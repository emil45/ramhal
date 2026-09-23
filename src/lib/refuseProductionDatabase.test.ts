import { describe, expect, it } from 'vitest'

import { assertDevelopmentDoesNotUseNeon, assertNotNeonDatabase, assertNotProductionDatabase } from '@/lib/refuseProductionDatabase'

describe('assertNotProductionDatabase', () => {
  it('refuses production\'s own host, by exact match, and includes the caller-supplied guidance', () => {
    expect(() =>
      assertNotProductionDatabase('ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech', 'Use the testing branch instead.'),
    ).toThrow(/Refusing:.*is production's own database\. Use the testing branch instead\./)
  })

  it('allows any other host, such as the long-lived testing branch', () => {
    expect(() => assertNotProductionDatabase('ep-curly-feather-b1cg895m-pooler.c-5.eu-central-1.aws.neon.tech', 'unused')).not.toThrow()
  })

  it('does not match on a mere substring or prefix of the production host', () => {
    expect(() =>
      assertNotProductionDatabase('ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech.evil.example', 'unused'),
    ).not.toThrow()
  })
})

describe('assertNotNeonDatabase', () => {
  it('refuses any Neon host, not only production\'s', () => {
    expect(() => assertNotNeonDatabase('ep-curly-feather-b1cg895m-pooler.c-5.eu-central-1.aws.neon.tech', 'Use local Postgres.')).toThrow(
      /Neon database.*Use local Postgres\./,
    )
  })

  it('allows localhost', () => {
    expect(() => assertNotNeonDatabase('localhost', 'unused')).not.toThrow()
  })
})

describe('assertDevelopmentDoesNotUseNeon', () => {
  const neonHost = 'ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech'

  it('refuses a Neon host in development', () => {
    expect(() => assertDevelopmentDoesNotUseNeon({ appEnvironment: 'development', host: neonHost, override: undefined })).toThrow(/Refusing/)
  })

  it('allows it with a task-named override', () => {
    expect(() => assertDevelopmentDoesNotUseNeon({ appEnvironment: 'development', host: neonHost, override: 'TASK-45' })).not.toThrow()
  })

  it('rejects an override that does not name a task', () => {
    expect(() => assertDevelopmentDoesNotUseNeon({ appEnvironment: 'development', host: neonHost, override: '1' })).toThrow(/Refusing/)
  })

  it('leaves deployed environments alone', () => {
    expect(() => assertDevelopmentDoesNotUseNeon({ appEnvironment: 'production', host: neonHost, override: undefined })).not.toThrow()
  })

  it('allows a local host in development', () => {
    expect(() => assertDevelopmentDoesNotUseNeon({ appEnvironment: 'development', host: 'localhost', override: undefined })).not.toThrow()
  })
})
