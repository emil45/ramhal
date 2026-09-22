import { FULFILMENT_STATUS_LABELS } from '../../lib/orderStatus.ts'

import type { DefaultCellComponentProps } from 'payload'
import type { FulfilmentStatus } from '../../lib/orderStatus.ts'

const COLORS: Record<FulfilmentStatus, { bg: string; fg: string }> = {
  new: { bg: 'var(--theme-warning-150)', fg: 'var(--theme-warning-650)' },
  packed: { bg: 'var(--theme-elevation-100)', fg: 'var(--theme-elevation-600)' },
  posted: { bg: 'var(--theme-success-100)', fg: 'var(--theme-success-600)' },
  collected: { bg: 'var(--theme-success-100)', fg: 'var(--theme-success-600)' },
}

/** "ארוזה" / "נשלחה" / ... instead of the raw select value. Blank when the
 * order is not yet paid — Orders.fulfilmentStatus itself is hidden until then. */
export function FulfilmentStatusBadge({ cellData }: DefaultCellComponentProps) {
  const status = cellData as FulfilmentStatus | undefined
  if (!status || !(status in COLORS)) return null
  const { bg, fg } = COLORS[status]
  return (
    <span style={{ display: 'inline-block', borderRadius: '4px', padding: '0.15rem 0.6rem', fontSize: '0.8125rem', background: bg, color: fg }}>
      {FULFILMENT_STATUS_LABELS[status]}
    </span>
  )
}
