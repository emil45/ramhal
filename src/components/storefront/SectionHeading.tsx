import type { ReactNode } from 'react'

/**
 * The heading of a section on a page: the title, an optional action opposite
 * it (e.g. "all books"), and a hairline with a short gold segment at its
 * start — the printer's rule under a chapter title. `as` picks the tag: a page's title is
 * an h1, everything else an h2.
 */
export function SectionHeading({ action, as: Tag = 'h2', children }: { action?: ReactNode; as?: 'h1' | 'h2'; children: ReactNode }) {
  return (
    <div className="relative mb-8 flex items-end justify-between gap-4 border-b border-border pb-3">
      <Tag className={Tag === 'h1' ? 'type-title' : 'type-heading'}>{children}</Tag>
      {action}
      <span aria-hidden className="absolute start-0 -bottom-px h-[3px] w-16 bg-gold" />
    </div>
  )
}
