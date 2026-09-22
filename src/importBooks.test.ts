import { describe, expect, it } from 'vitest'

import { localizeTitles } from './importBooks.ts'

describe('localizeTitles', () => {
  it('leaves a genuine Hebrew-site entry under he', () => {
    expect(localizeTitles({ he: 'מסילת ישרים' })).toEqual({ he: 'מסילת ישרים' })
  })

  it('leaves genuine Latin-script site entries under their own site', () => {
    expect(localizeTitles({ en: 'The Path of the Just', fr: 'Le Sentier de Rectitude' })).toEqual({
      en: 'The Path of the Just',
      fr: 'Le Sentier de Rectitude',
    })
  })

  it('reassigns a Hebrew-script title to he even when scraped from the fr/en site', () => {
    // The book this happened to: TASK-20's data audit found 21 books whose
    // real Hebrew title was written under fr/en instead, because no
    // matching he-site entry existed to key it correctly.
    expect(localizeTitles({ fr: 'זוהר תניינא חלק א׳' })).toEqual({ he: 'זוהר תניינא חלק א׳' })
  })

  it('drops a duplicate Hebrew title on a second site rather than keeping it under that site too', () => {
    expect(localizeTitles({ he: 'מסילת ישרים', fr: 'מסילת ישרים' })).toEqual({ he: 'מסילת ישרים' })
  })

  it('keeps the first Hebrew-script title when the real he entry is missing but two other sites both carry it', () => {
    expect(localizeTitles({ fr: 'מסילת ישרים', en: 'מסילת ישרים' })).toEqual({ he: 'מסילת ישרים' })
  })
})
