import { AdminBadge } from './AdminBadge.tsx'
import { PAYMENT_STATUS_LABELS } from '../../lib/orderStatus.ts'

import type { DefaultCellComponentProps } from 'payload'
import type { BadgeTone } from './AdminBadge.tsx'
import type { PaymentStatus } from '../../lib/orderStatus.ts'

const TONES: Record<PaymentStatus, BadgeTone> = {
  pending: 'attention',
  paid: 'positive',
  failed: 'negative',
  cancelled: 'neutral',
}

/** "שולם" / "ממתין לתשלום" / ... instead of the raw select value. */
export function PaymentStatusBadge({ cellData }: DefaultCellComponentProps) {
  const status = cellData as PaymentStatus | undefined
  if (!status || !(status in TONES)) return null
  return <AdminBadge tone={TONES[status]}>{PAYMENT_STATUS_LABELS[status]}</AdminBadge>
}
