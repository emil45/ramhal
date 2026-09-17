import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { collectMissingHebrewLabels } from '@/lib/collectMissingHebrewLabels'

describe('collectMissingHebrewLabels', () => {
  it('passes a field with a Hebrew label', () => {
    const fields: Field[] = [{ name: 'title', type: 'text', label: 'כותרת' }]
    expect(collectMissingHebrewLabels(fields, 'test')).toEqual([])
  })

  it('flags a field with no label', () => {
    const fields: Field[] = [{ name: 'title', type: 'text' }]
    expect(collectMissingHebrewLabels(fields, 'test')).toEqual(['test.title: missing a Hebrew label'])
  })

  it('flags a field with an English-only label', () => {
    const fields: Field[] = [{ name: 'isbn', type: 'text', label: 'ISBN' }]
    expect(collectMissingHebrewLabels(fields, 'test')).toEqual(['test.isbn: missing a Hebrew label'])
  })

  it('recurses into array sub-fields and requires labels.singular/plural', () => {
    const fields: Field[] = [
      {
        name: 'prices',
        type: 'array',
        label: 'מחירים',
        labels: { singular: 'מחיר', plural: 'מחירים' },
        fields: [{ name: 'amount', type: 'number' }],
      },
    ]
    expect(collectMissingHebrewLabels(fields, 'test')).toEqual(['test.prices.amount: missing a Hebrew label'])
  })

  it('flags an array missing Hebrew labels.singular/plural even if its own label is Hebrew', () => {
    const fields: Field[] = [
      { name: 'prices', type: 'array', label: 'מחירים', fields: [] },
    ]
    expect(collectMissingHebrewLabels(fields, 'test')).toEqual([
      'test.prices: array is missing Hebrew labels.singular/labels.plural',
    ])
  })

  it('does not require a label on presentational fields with no name', () => {
    const fields: Field[] = [
      {
        type: 'row',
        fields: [{ name: 'title', type: 'text', label: 'כותרת' }],
      },
    ]
    expect(collectMissingHebrewLabels(fields, 'test')).toEqual([])
  })
})
