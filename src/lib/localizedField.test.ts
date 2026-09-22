import { describe, expect, it } from 'vitest'

import { hasValueInAnyLocale, pickDisplayTitle } from '@/lib/localizedField'

describe('hasValueInAnyLocale', () => {
  it('is false when no locale has been given at all', () => {
    expect(hasValueInAnyLocale(null)).toBe(false)
    expect(hasValueInAnyLocale(undefined)).toBe(false)
    expect(hasValueInAnyLocale({})).toBe(false)
  })

  it('is false when every locale is blank', () => {
    expect(hasValueInAnyLocale({ he: '', fr: '   ', en: undefined })).toBe(false)
  })

  it('is true when exactly one locale has content — a French-only book', () => {
    expect(hasValueInAnyLocale({ fr: 'Les Soixante Dix Arrangements' })).toBe(true)
  })

  it('is true when the value locale is not the one with content', () => {
    expect(hasValueInAnyLocale({ he: '', fr: 'Titre', en: '' })).toBe(true)
  })
})

describe('pickDisplayTitle', () => {
  it('is null when nothing has ever been given a title', () => {
    expect(pickDisplayTitle(null)).toBeNull()
    expect(pickDisplayTitle({})).toBeNull()
    expect(pickDisplayTitle({ he: '', fr: '  ' })).toBeNull()
  })

  it('prefers Hebrew when it exists', () => {
    expect(pickDisplayTitle({ he: 'כותרת', fr: 'Titre', en: 'Title' })).toEqual({ locale: 'he', title: 'כותרת' })
  })

  it('falls back to French, then English, in that order', () => {
    expect(pickDisplayTitle({ fr: 'Titre', en: 'Title' })).toEqual({ locale: 'fr', title: 'Titre' })
    expect(pickDisplayTitle({ en: 'Title' })).toEqual({ locale: 'en', title: 'Title' })
  })
})
