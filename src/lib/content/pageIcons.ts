import { BookOpen, Building2, Landmark } from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

// The fixed set of icons an editor can attach to a feature card. A closed
// list, not free text, so every value is guaranteed to render — extend it
// here (and nowhere else) when a page needs a new one.
export const PAGE_ICONS = {
  landmark: Landmark,
  bookOpen: BookOpen,
  building2: Building2,
} as const satisfies Record<string, LucideIcon>

export type PageIconName = keyof typeof PAGE_ICONS

export const PAGE_ICON_OPTIONS = [
  { label: 'ציון דרך', value: 'landmark' },
  { label: 'ספר פתוח', value: 'bookOpen' },
  { label: 'בניין', value: 'building2' },
] as const satisfies { label: string; value: PageIconName }[]
