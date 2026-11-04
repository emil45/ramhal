import { describe, expect, it } from 'vitest'

import { defaultDestinationCountry } from './defaultDestination'

const served = ['IL', 'FR', 'DE']

describe('defaultDestinationCountry', () => {
  it('opens on the visitor’s country when the shop ships there', () => {
    expect(defaultDestinationCountry({ servedCountries: served, visitorCountry: 'IL', languageCountry: 'FR' })).toBe('IL')
  })

  it('falls back to the language’s country when the visitor’s is unknown', () => {
    expect(defaultDestinationCountry({ servedCountries: served, visitorCountry: null, languageCountry: 'FR' })).toBe('FR')
  })

  it('falls back to the language’s country when the shop does not ship to the visitor’s', () => {
    expect(defaultDestinationCountry({ servedCountries: served, visitorCountry: 'JP', languageCountry: 'FR' })).toBe('FR')
  })

  it('opens on the first served country when neither is served', () => {
    expect(defaultDestinationCountry({ servedCountries: served, visitorCountry: 'JP', languageCountry: 'US' })).toBe('IL')
  })

  it('has no default when the shop ships nowhere in this currency', () => {
    expect(defaultDestinationCountry({ servedCountries: [], visitorCountry: 'IL', languageCountry: 'IL' })).toBeUndefined()
  })
})
