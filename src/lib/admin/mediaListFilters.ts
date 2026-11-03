import { adminListFilterHref } from './adminListFilters.ts'

const MEDIA_LIST_PATH = '/admin/collections/media'

type ListFilter = { label: string; href: string }

/** One-click views above the media list. A picture with no alt text is invisible to screen readers and to Google. */
export const MEDIA_LIST_FILTERS: ListFilter[] = [
  { label: 'כל הקבצים', href: MEDIA_LIST_PATH },
  { label: 'חסר טקסט חלופי', href: adminListFilterHref(MEDIA_LIST_PATH, [['alt', 'exists', 'false']]) },
]
