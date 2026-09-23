const HEBREW_MARKS = /[\u0591-\u05c7]/g
const QUOTE_MARKS = /["'׳״‘’“”]/g
const NON_SEARCH_CHARACTERS = /[^\p{L}\p{N}\s]/gu

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(HEBREW_MARKS, '')
    .replace(QUOTE_MARKS, '')
    .replace(NON_SEARCH_CHARACTERS, ' ')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Small in-memory search for the single sample entry. The eventual archive
 * uses the PostgreSQL Hebrew full-text configuration chosen in DECISIONS §4;
 * keeping this matcher pure makes the prototype honest without pretending it
 * is the thousands-of-records implementation.
 */
export function matchesQuestionSearch(values: readonly string[], query: string): boolean {
  const terms = normalizeSearchText(query).split(' ').filter(Boolean)
  if (terms.length === 0) return true

  const searchableText = normalizeSearchText(values.join(' '))
  return terms.every((term) => searchableText.includes(term))
}
