import { describe, expect, it } from 'vitest'

import { buildTableOfContents } from './tableOfContents.ts'

import type { PageSection } from './pageSections.ts'

function section(style: 'standard' | 'article' | 'video' | 'concluding', heading: string): PageSection {
  return { heading: { blockType: 'sectionHeading', style, heading } as never, body: [] }
}

describe('buildTableOfContents', () => {
  it('includes only article-style sections, in order', () => {
    const toc = buildTableOfContents([section('article', 'חייו בקצרה'), section('standard', 'ביוגרפיה'), section('article', 'אמונה')])

    expect(toc).toEqual([
      { href: '#חייו-בקצרה', label: 'חייו בקצרה' },
      { href: '#אמונה', label: 'אמונה' },
    ])
  })

  it('returns nothing when there is no article-style section', () => {
    expect(buildTableOfContents([section('standard', 'ביוגרפיה')])).toEqual([])
  })

  it('skips a headingless section', () => {
    expect(buildTableOfContents([{ heading: null, body: [] }])).toEqual([])
  })
})
