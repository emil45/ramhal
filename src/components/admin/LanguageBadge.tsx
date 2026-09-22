import type { DefaultCellComponentProps } from 'payload'

const LOCALE_LABELS: Record<string, string> = { he: 'עברית', fr: 'Français', en: 'English' }

/** The language a row's `displayTitle` (src/collections/fields/localizedDisplayTitleFields.ts)
 * was actually shown in, so a Hebrew list never silently implies a Hebrew book. */
export function LanguageBadge({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== 'string' || !cellData) return null
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: '4px',
        padding: '0.15rem 0.6rem',
        fontSize: '0.8125rem',
        background: 'var(--theme-elevation-100)',
        color: 'var(--theme-elevation-600)',
      }}
    >
      {LOCALE_LABELS[cellData] ?? cellData}
    </span>
  )
}
