import { LabeledListView } from './LabeledListView'
import { QuoteView } from './QuoteView'
import { RichText } from '@/components/storefront/RichText'

import type { Page } from '@/payload-types'

type ArticleBlock = Extract<NonNullable<Page['content']>[number], { blockType: 'richText' | 'quote' | 'labeledList' }>

/** One block of a long-form article's flowing content — the only three
 * block types `/ramhal`'s sections mix together. */
export function ArticleBodyBlock({ block }: { block: ArticleBlock }) {
  switch (block.blockType) {
    case 'richText':
      return <RichText className="type-prose mt-5 gap-5 text-lg" content={block.body} />
    case 'quote':
      return <QuoteView block={block} />
    case 'labeledList':
      return <LabeledListView block={block} />
  }
}
