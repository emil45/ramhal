import type { ReactNode } from 'react'

export type BadgeTone = 'positive' | 'attention' | 'negative' | 'neutral' | 'info'

/** A coloured label for a state that deserves a second look. The colours live in admin-theme.css. */
export function AdminBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`admin-badge admin-badge--${tone}`}>{children}</span>
}
