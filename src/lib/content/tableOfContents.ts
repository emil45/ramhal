import { slugify } from './slugify.ts'

import type { PageSection } from './pageSections.ts'

export type TableOfContentsItem = {
  href: `#${string}`
  label: string
}

/**
 * The sticky in-page navigation on a long-form article page: one entry per
 * "article"-style section, in order. Other section styles (a page's simple
 * biography or video heading) never need a table of contents, so they're
 * left out rather than cluttering it.
 */
export function buildTableOfContents(sections: readonly PageSection[]): TableOfContentsItem[] {
  return sections
    .filter((section) => section.heading?.style === 'article')
    .map((section) => ({
      href: `#${slugify(section.heading!.heading)}`,
      label: section.heading!.heading,
    }))
}
