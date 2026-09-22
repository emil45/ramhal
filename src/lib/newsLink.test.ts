import { describe, expect, it } from 'vitest'

import { validateNewsLinkUrl } from '@/lib/newsLink'

describe('validateNewsLinkUrl', () => {
  it.each([undefined, null, ''])('accepts an omitted optional value', (value) => {
    expect(validateNewsLinkUrl(value)).toBe(true)
  })

  it.each(['/books', '/en/books/new-book', '/#news'])('accepts a site-relative path', (value) => {
    expect(validateNewsLinkUrl(value)).toBe(true)
  })

  it.each(['https://ramhal.com/books', 'http://example.com/event'])('accepts an absolute HTTP URL', (value) => {
    expect(validateNewsLinkUrl(value)).toBe(true)
  })

  it.each(['books', 'mailto:office@example.com', '//example.com/event', 'https://'])('rejects an unsafe or incomplete URL', (value) => {
    expect(validateNewsLinkUrl(value)).toEqual(expect.any(String))
  })
})
