import { describe, expect, it } from 'vitest'

import { groupPageSections } from './pageSections.ts'

import type { Page } from '@/payload-types'

type PageBlock = NonNullable<Page['content']>[number]

function heading(text: string): PageBlock {
  return { blockType: 'sectionHeading', style: 'standard', heading: text }
}

function paragraph(): PageBlock {
  return {
    blockType: 'richText',
    body: { root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 } },
  }
}

describe('groupPageSections', () => {
  it('starts a new section at each sectionHeading block', () => {
    const sections = groupPageSections([heading('One'), paragraph(), paragraph(), heading('Two'), paragraph()])

    expect(sections).toHaveLength(2)
    expect(sections[0].heading?.heading).toBe('One')
    expect(sections[0].body).toHaveLength(2)
    expect(sections[1].heading?.heading).toBe('Two')
    expect(sections[1].body).toHaveLength(1)
  })

  it('collects leading blocks with no heading into a headingless section', () => {
    const sections = groupPageSections([paragraph(), heading('One'), paragraph()])

    expect(sections).toHaveLength(2)
    expect(sections[0].heading).toBeNull()
    expect(sections[0].body).toHaveLength(1)
  })

  it('returns nothing for empty content', () => {
    expect(groupPageSections([])).toEqual([])
  })
})
