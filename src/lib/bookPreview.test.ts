import { describe, expect, it } from 'vitest'

import { bookPreviewUrl } from '@/lib/bookPreview'

import type { Media } from '@/payload-types'

function file(overrides: Partial<Media>): Media {
  return { id: 1, updatedAt: '2026-11-03T00:00:00.000Z', createdAt: '2026-11-03T00:00:00.000Z', ...overrides }
}

describe('bookPreviewUrl', () => {
  it('returns the address of an uploaded PDF', () => {
    expect(bookPreviewUrl(file({ mimeType: 'application/pdf', url: '/api/media/file/haggadah.pdf' }))).toBe('/api/media/file/haggadah.pdf')
  })

  it('shows nothing for a book without a reading copy', () => {
    expect(bookPreviewUrl(null)).toBeNull()
    expect(bookPreviewUrl(undefined)).toBeNull()
  })

  it('shows nothing when the reference was not loaded', () => {
    expect(bookPreviewUrl(7)).toBeNull()
  })

  it('shows nothing for a file that is not a PDF', () => {
    expect(bookPreviewUrl(file({ mimeType: 'image/webp', url: '/api/media/file/cover.webp' }))).toBeNull()
  })
})
