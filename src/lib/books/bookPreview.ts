import type { Media } from '@/payload-types'

const PDF_MIME_TYPE = 'application/pdf'

/**
 * The address of a book's reading copy, or null when the book has none. An
 * unpopulated reference (a deleted file) or a file that is not a PDF shows
 * nothing rather than a button that opens an error.
 */
export function bookPreviewUrl(previewPdf: number | Media | null | undefined): string | null {
  if (typeof previewPdf !== 'object' || previewPdf === null) return null
  if (previewPdf.mimeType !== PDF_MIME_TYPE) return null
  return previewPdf.url ?? null
}
