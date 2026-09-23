import { PAYMENT_STATUS_LABELS } from '../../lib/orderStatus.ts'

import type { DefaultCellComponentProps } from 'payload'
import type { PaymentStatus } from '../../lib/orderStatus.ts'

const COLORS: Record<PaymentStatus, { bg: string; fg: string }> = {
  pending: { bg: 'var(--theme-warning-150)', fg: 'var(--theme-warning-650)' },
  paid: { bg: 'var(--theme-success-100)', fg: 'var(--theme-success-600)' },
  failed: { bg: 'var(--theme-error-100)', fg: 'var(--theme-error-600)' },
  // elevation-500 on elevation-100 measures 3.61:1 — below WCAG AA's 4.5:1
  // for normal text (checked directly). elevation-600 measures 5.15:1.
  cancelled: { bg: 'var(--theme-elevation-100)', fg: 'var(--theme-elevation-600)' },
}

/** "שולם" / "ממתין לתשלום" / ... instead of the raw select value. */
export function PaymentStatusBadge({ cellData }: DefaultCellComponentProps) {
  const status = cellData as PaymentStatus | undefined
  if (!status || !(status in COLORS)) return null
  const { bg, fg } = COLORS[status]
  return (
    <span style={{ display: 'inline-block', borderRadius: '4px', padding: '0.15rem 0.6rem', fontSize: '0.8125rem', background: bg, color: fg }}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}
