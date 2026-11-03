import type { Page } from '@/payload-types'

type PageBlock = NonNullable<Page['content']>[number]
type SectionHeadingBlock = Extract<PageBlock, { blockType: 'sectionHeading' }>

export type PageSection = {
  heading: SectionHeadingBlock | null
  body: PageBlock[]
}

/**
 * Groups a page's flat `content` array into sections: a sectionHeading block
 * starts a new section, and every block after it — up to the next
 * sectionHeading — is that section's body. Content before the first
 * sectionHeading (there normally isn't any) becomes a headingless section,
 * so no block is ever dropped.
 */
export function groupPageSections(blocks: readonly PageBlock[]): PageSection[] {
  const sections: PageSection[] = []

  for (const block of blocks) {
    if (block.blockType === 'sectionHeading') {
      sections.push({ heading: block, body: [] })
      continue
    }

    if (sections.length === 0) sections.push({ heading: null, body: [] })
    sections[sections.length - 1].body.push(block)
  }

  return sections
}
