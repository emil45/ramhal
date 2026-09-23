import { describe, expect, it } from 'vitest'

import { matchesQuestionSearch } from '@/lib/questionSearch'

const SEARCHABLE_QUESTION = [
  'לימוד כתבי הרמח״ל',
  'מהי הדרך הנכונה להתחיל ללמוד את כתבי הרמח״ל?',
  'מסילת ישרים ודרך ה׳',
]

describe('matchesQuestionSearch', () => {
  it('matches every term across the question, answer, and topic', () => {
    expect(matchesQuestionSearch(SEARCHABLE_QUESTION, 'דרך ללמוד')).toBe(true)
    expect(matchesQuestionSearch(SEARCHABLE_QUESTION, 'הלכה למעשה')).toBe(false)
  })

  it('ignores Hebrew niqqud, cantillation, and quote-mark variants', () => {
    expect(matchesQuestionSearch(SEARCHABLE_QUESTION, 'רַמְחַ״ל')).toBe(true)
    expect(matchesQuestionSearch(SEARCHABLE_QUESTION, "דרך ה'")).toBe(true)
  })

  it('shows every question for an empty or punctuation-only query', () => {
    expect(matchesQuestionSearch(SEARCHABLE_QUESTION, '')).toBe(true)
    expect(matchesQuestionSearch(SEARCHABLE_QUESTION, '״ — ')).toBe(true)
  })
})
