import { describe, expect, it } from 'vitest'

import { chooseColor, findBookColor, isSameCartLine, isValidSwatch, titleWithColor } from '@/lib/bookColors'

import type { BookColor } from '@/lib/bookColors'

const brown: BookColor = { id: 'brown-id', name: 'חום', swatch: '#5a2d1b' }
const white: BookColor = { id: 'white-id', name: 'לבן', swatch: '#f4f1ea' }

describe('isValidSwatch', () => {
  it('accepts a six-digit hex colour in either case', () => {
    expect(isValidSwatch('#5a2d1b')).toBe(true)
    expect(isValidSwatch('#F4F1EA')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isValidSwatch('5a2d1b')).toBe(false)
    expect(isValidSwatch('#fff')).toBe(false)
    expect(isValidSwatch('brown')).toBe(false)
    expect(isValidSwatch('#5a2d1bff')).toBe(false)
  })
})

describe('findBookColor', () => {
  it('finds a colour by its id', () => {
    expect(findBookColor([brown, white], 'white-id')).toBe(white)
  })

  it('finds nothing for a missing id, an unknown id or a book without colours', () => {
    expect(findBookColor([brown], null)).toBeNull()
    expect(findBookColor([brown], 'gone')).toBeNull()
    expect(findBookColor(undefined, 'brown-id')).toBeNull()
  })
})

describe('chooseColor', () => {
  it('requires a known colour when the book has colours', () => {
    expect(chooseColor([brown, white], 'white-id')).toEqual({ ok: true, color: white })
    expect(chooseColor([brown, white], null)).toEqual({ ok: false })
    expect(chooseColor([brown, white], 'gone')).toEqual({ ok: false })
  })

  it('accepts no colour for a book without colours, and refuses one', () => {
    expect(chooseColor(undefined, null)).toEqual({ ok: true, color: null })
    expect(chooseColor([], undefined)).toEqual({ ok: true, color: null })
    expect(chooseColor([], 'brown-id')).toEqual({ ok: false })
  })
})

describe('titleWithColor', () => {
  it('adds the colour to the title an order line is sold under', () => {
    expect(titleWithColor('הגדה של פסח', white)).toBe('הגדה של פסח — לבן')
  })

  it('leaves the title alone for a book without a chosen colour', () => {
    expect(titleWithColor('הגדה של פסח', null)).toBe('הגדה של פסח')
  })
})

describe('isSameCartLine', () => {
  it('matches only the same book in the same colour', () => {
    expect(isSameCartLine({ bookId: 1, colorId: 'a' }, { bookId: 1, colorId: 'a' })).toBe(true)
    expect(isSameCartLine({ bookId: 1, colorId: 'a' }, { bookId: 1, colorId: 'b' })).toBe(false)
    expect(isSameCartLine({ bookId: 1, colorId: 'a' }, { bookId: 2, colorId: 'a' })).toBe(false)
  })

  it('treats a missing colour and null as the same', () => {
    expect(isSameCartLine({ bookId: 1 }, { bookId: 1, colorId: null })).toBe(true)
  })
})
