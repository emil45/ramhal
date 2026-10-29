import { AdminBadge } from './AdminBadge.tsx'
import { FULFILMENT_STATUS_LABELS } from '../../lib/orderStatus.ts'

import type { DefaultCellComponentProps } from 'payload'
import type { BadgeTone } from './AdminBadge.tsx'
import type { FulfilmentStatus } from '../../lib/orderStatus.ts'

const TONES: Record<FulfilmentStatus, BadgeTone> = {
  new: 'attention',
  packed: 'info',
  posted: 'positive',
  collected: 'positive',
}

/** "ארוזה" / "נשלחה" / ... instead of the raw select value. Blank when the
 * order is not yet paid — Orders.fulfilmentStatus itself is hidden until then. */
export function FulfilmentStatusBadge({ cellData }: DefaultCellComponentProps) {
  const status = cellData as FulfilmentStatus | undefined
  if (!status || !(status in TONES)) return null
  return <AdminBadge tone={TONES[status]}>{FULFILMENT_STATUS_LABELS[status]}</AdminBadge>
}
