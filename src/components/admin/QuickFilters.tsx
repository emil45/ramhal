import { isActiveListFilter } from '../../lib/listFilterState.ts'

type ListFilter = { label: string; href: string }
type SearchParameters = Record<string, string | string[] | undefined>

/** Shared rendering for a row of one-click, pre-filtered list links — see
 * OrderQuickFilters.tsx and BookQuickFilters.tsx, the two Payload actually
 * loads (`beforeListTable` needs a named export per collection). The link for
 * the view on screen is marked, so the editor can tell a filtered list from the full one. */
export function QuickFilters({ filters, searchParams = {} }: { filters: ListFilter[]; searchParams?: SearchParameters }) {
  return (
    <nav className="quick-filters">
      {filters.map((filter) => (
        <a
          key={filter.href}
          href={filter.href}
          className="quick-filters__link"
          aria-current={isActiveListFilter(filter.href, searchParams) ? 'page' : undefined}
        >
          {filter.label}
        </a>
      ))}
    </nav>
  )
}
