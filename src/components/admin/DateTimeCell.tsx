import { formatAdminDateTime } from '../../lib/adminDateTime.ts'

import type { DefaultCellComponentProps } from 'payload'

/** A timestamp as "29 באוקטובר 2026 בשעה 23:06", in place of Payload's month-first, 12-hour default. */
export function DateTimeCell({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== 'string' || !cellData) return null
  return <span>{formatAdminDateTime(cellData)}</span>
}
