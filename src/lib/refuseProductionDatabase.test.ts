import { describe, expect, it } from 'vitest'

import { assertNotProductionDatabase } from '@/lib/refuseProductionDatabase'

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
