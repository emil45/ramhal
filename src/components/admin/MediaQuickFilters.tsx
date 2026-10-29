import { QuickFilters } from './QuickFilters.tsx'
import { MEDIA_LIST_FILTERS } from '../../lib/mediaListFilters.ts'

import type { ListViewServerProps } from 'payload'

/** One-click views above the media list — see MEDIA_LIST_FILTERS. */
export function MediaQuickFilters({ searchParams }: ListViewServerProps) {
  return <QuickFilters filters={MEDIA_LIST_FILTERS} searchParams={searchParams} />
}
