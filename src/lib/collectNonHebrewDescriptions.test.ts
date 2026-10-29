import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { collectNonHebrewDescriptions } from '@/lib/collectNonHebrewDescriptions'

describe('collectNonHebrewDescriptions', () => {
  it('passes a Hebrew description, even one that quotes a Latin word', () => {
    const fields: Field[] = [{ name: 'slug', type: 'text', admin: { description: 'כתובת ה-URL של הספר.' } }]
    expect(collectNonHebrewDescriptions(fields, 'test')).toEqual([])
  })

  it('passes a field with no description', () => {
    const fields: Field[] = [{ name: 'title', type: 'text' }]
    expect(collectNonHebrewDescriptions(fields, 'test')).toEqual([])
  })

  it('flags an English description', () => {
    const fields: Field[] = [{ name: 'time', type: 'text', admin: { description: 'Free text, not a time field' } }]
    expect(collectNonHebrewDescriptions(fields, 'test')).toEqual(['test.time: description is not written in Hebrew'])
  })

  it('flags a mostly-English description that quotes a Hebrew phrase', () => {
    const fields: Field[] = [
      { name: 'time', type: 'text', admin: { description: 'Free text, not a time field — "נץ החמה" is a valid value.' } },
    ]
    expect(collectNonHebrewDescriptions(fields, 'test')).toEqual(['test.time: description is not written in Hebrew'])
  })

  it('flags a "e.g." hint with a single Hebrew word', () => {
    const fields: Field[] = [{ name: 'days', type: 'text', admin: { description: 'e.g. א׳–ה׳' } }]
    expect(collectNonHebrewDescriptions(fields, 'test')).toEqual(['test.days: description is not written in Hebrew'])
  })

  it('recurses into array sub-fields, tabs and block fields', () => {
    const fields: Field[] = [
      { name: 'rows', type: 'array', fields: [{ name: 'note', type: 'text', admin: { description: 'English note' } }] },
      {
        type: 'tabs',
        tabs: [{ label: 'כרטיסייה', fields: [{ name: 'hint', type: 'text', admin: { description: 'Another note' } }] }],
      },
      {
        name: 'content',
        type: 'blocks',
        blocks: [{ slug: 'quote', fields: [{ name: 'source', type: 'text', admin: { description: 'A third note' } }] }],
      },
    ]
    expect(collectNonHebrewDescriptions(fields, 'test')).toEqual([
      'test.rows.note: description is not written in Hebrew',
      'test.hint: description is not written in Hebrew',
      'test.content.quote.source: description is not written in Hebrew',
    ])
  })
})
