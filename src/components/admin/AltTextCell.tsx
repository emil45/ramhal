import { AdminBadge } from './AdminBadge.tsx'

import type { DefaultCellComponentProps } from 'payload'

/** The picture's alt text, or a badge where it is missing — Payload's own empty-cell placeholder
 * ("<ללא טקסט חלופי>") reads as a value, not as something left to do. */
export function AltTextCell({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData === 'string' && cellData.trim() !== '') return <span>{cellData}</span>
  return <AdminBadge tone="attention">חסר טקסט חלופי</AdminBadge>
}
