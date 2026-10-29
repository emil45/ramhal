import { AdminBadge } from './AdminBadge.tsx'

import type { DefaultCellComponentProps } from 'payload'

/** Replaces the raw `true`/`false` glyph the default checkbox column shows.
 * Plain text while the book is available, a badge only for the exception —
 * a column of identical badges is noise that hides the one that matters. */
export function StockBadge({ cellData }: DefaultCellComponentProps) {
  if (Boolean(cellData)) return <span>במלאי</span>
  return <AdminBadge tone="negative">אזל</AdminBadge>
}
