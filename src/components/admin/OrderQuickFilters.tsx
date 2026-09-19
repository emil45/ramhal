import { ORDER_LIST_FILTERS } from '../../lib/orderListFilters.ts'

/** One-click views above the orders list — see ORDER_LIST_FILTERS. */
export function OrderQuickFilters() {
  return (
    <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
      {ORDER_LIST_FILTERS.map((filter) => (
        <a
          key={filter.href}
          href={filter.href}
          style={{
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '4px',
            padding: '0.4rem 0.9rem',
            textDecoration: 'none',
            color: 'var(--theme-text)',
            background: 'var(--theme-elevation-50)',
          }}
        >
          {filter.label}
        </a>
      ))}
    </nav>
  )
}
