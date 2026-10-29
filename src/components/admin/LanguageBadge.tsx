import { AdminBadge } from './AdminBadge.tsx'
import { DEFAULT_LOCALE } from '../../lib/locale.ts'

import type { DefaultCellComponentProps } from 'payload'

const LOCALE_LABELS: Record<string, string> = { he: 'עברית', fr: 'Français', en: 'English' }

/** The language a row's `displayTitle` (src/collections/fields/localizedDisplayTitleFields.ts)
 * was actually shown in, so a Hebrew list never silently implies a Hebrew book.
 * Hebrew, the expected case, is plain text; another language is a badge. */
export function LanguageBadge({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== 'string' || !cellData) return null
  const label = LOCALE_LABELS[cellData] ?? cellData
  if (cellData === DEFAULT_LOCALE) return <span>{label}</span>
  return <AdminBadge tone="info">{label}</AdminBadge>
}
