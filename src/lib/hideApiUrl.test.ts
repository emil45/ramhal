import type { CollectionConfig, GlobalConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import { hideApiUrl } from '@/lib/hideApiUrl'

describe('hideApiUrl', () => {
  it('turns the API tab off and keeps the rest of the admin config', () => {
    const books: CollectionConfig = { slug: 'books', fields: [], admin: { group: 'חנות', useAsTitle: 'displayTitle' } }
    const hidden = hideApiUrl(books)
    expect(hidden.admin).toEqual({ group: 'חנות', useAsTitle: 'displayTitle', hideAPIURL: true })
  })

  it('works on a config that declares no admin options at all', () => {
    const schedule: GlobalConfig = { slug: 'schedule', fields: [] }
    expect(hideApiUrl(schedule).admin).toEqual({ hideAPIURL: true })
  })

  it('does not change the config it was given', () => {
    const original: CollectionConfig = { slug: 'books', fields: [], admin: { group: 'חנות' } }
    hideApiUrl(original)
    expect(original.admin).toEqual({ group: 'חנות' })
  })
})
