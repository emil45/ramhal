import type { DefaultCellComponentProps } from 'payload'

/** Replaces the raw `true`/`false` glyph the default checkbox column shows. */
export function StockBadge({ cellData }: DefaultCellComponentProps) {
  const inStock = Boolean(cellData)
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: '4px',
        padding: '0.15rem 0.6rem',
        fontSize: '0.8125rem',
        background: inStock ? 'var(--theme-success-100)' : 'var(--theme-elevation-100)',
        // elevation-500 on elevation-100 measures 3.61:1 — below WCAG AA's
        // 4.5:1 for normal text (checked directly, not eyeballed).
        // elevation-600 measures 5.15:1.
        color: inStock ? 'var(--theme-success-600)' : 'var(--theme-elevation-600)',
      }}
    >
      {inStock ? 'במלאי' : 'אזל'}
    </span>
  )
}
