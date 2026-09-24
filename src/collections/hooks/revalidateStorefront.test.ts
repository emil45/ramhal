import { beforeEach, describe, expect, it, vi } from 'vitest'

import { revalidatePath } from 'next/cache.js'
import { after } from 'next/server.js'

import { revalidateStorefront, SKIP_STOREFRONT_REVALIDATION } from './revalidateStorefront'

vi.mock('next/cache.js', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/server.js', () => ({ after: vi.fn() }))

beforeEach(() => {
  vi.mocked(revalidatePath).mockClear()
  vi.mocked(after).mockReset()
})

describe('revalidateStorefront', () => {
  it('marks every page under the root layout stale, but only once the request is over', () => {
    revalidateStorefront({ context: {} })
    expect(revalidatePath).not.toHaveBeenCalled()

    const [task] = vi.mocked(after).mock.calls[0]
    expect(task).toBeTypeOf('function')
    if (typeof task === 'function') task()

    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith('/', 'layout')
  })

  it('does nothing for a write that opts out', () => {
    revalidateStorefront({ context: SKIP_STOREFRONT_REVALIDATION })

    expect(after).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
