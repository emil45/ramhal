import { describe, expect, it } from 'vitest'

import { assertNotProductionDatabase } from '@/test/refuseProductionDatabase'

describe('assertNotProductionDatabase', () => {
  it('refuses production\'s own host, by exact match', () => {
    expect(() => assertNotProductionDatabase('ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech')).toThrow(
      /Refusing to run tests against production/,
    )
  })

  it('allows any other host, such as the long-lived testing branch', () => {
    expect(() => assertNotProductionDatabase('ep-curly-feather-b1cg895m-pooler.c-5.eu-central-1.aws.neon.tech')).not.toThrow()
  })

  it('does not match on a mere substring or prefix of the production host', () => {
    expect(() => assertNotProductionDatabase('ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech.evil.example')).not.toThrow()
  })
})
