type ListFilter = { label: string; href: string }

/** Shared rendering for a row of one-click, pre-filtered list links — see
 * OrderQuickFilters.tsx and BookQuickFilters.tsx, the two Payload actually
 * loads (`beforeListTable` needs a named export per collection). */
export function QuickFilters({ filters }: { filters: ListFilter[] }) {
  return (
    <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
      {filters.map((filter) => (
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
