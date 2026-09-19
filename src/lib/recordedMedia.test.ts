import { describe, expect, it } from 'vitest'

import { isRecordedMediaTitle } from '@/lib/recordedMedia'

describe('isRecordedMediaTitle', () => {
  it.each(['פורים CD', 'קל"ח פתחי חכמה cd', 'KALAH PITHE HOKHMA *2 CD MP3', 'מבא לחכמת הקבלה * 4 DVD', 'תקליטור שיעורים'])(
    'recognises %s as a recording',
    (title) => {
      expect(isRecordedMediaTitle(title)).toBe(true)
    },
  )

  it.each(['מסילת ישרים', 'Kabbalah du Arizal', 'La voix des justes', 'Discourse on Discord'])('leaves the book %s alone', (title) => {
    expect(isRecordedMediaTitle(title)).toBe(false)
  })
})
