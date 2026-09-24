import { beforeEach, describe, expect, it, vi } from 'vitest'

import { revalidatePath } from 'next/cache.js'

import { revalidateStorefront, SKIP_STOREFRONT_REVALIDATION } from './revalidateStorefront'

vi.mock('next/cache.js', () => ({ revalidatePath: vi.fn() }))

beforeEach(() => {
  vi.mocked(revalidatePath).mockClear()
})

describe('revalidateStorefront', () => {
  it('marks every page under the root layout stale', () => {
    revalidateStorefront({ context: {} })

    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith('/', 'layout')
  })

  it('does nothing for a write that opts out', () => {
    revalidateStorefront({ context: SKIP_STOREFRONT_REVALIDATION })

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
