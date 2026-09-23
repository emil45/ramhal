import { SourceCitation } from '@/app/(frontend)/[locale]/ramhal/RamhalArticleLayout'

import type { Page } from '@/payload-types'

type QuoteBlock = Extract<NonNullable<Page['content']>[number], { blockType: 'quote' }>

/**
 * A pull-quote in one of the visual treatments the narrative pages already
 * use. `label` (a short line above the quote, e.g. "En une phrase") and
 * `source` (a citation below it) are alternatives, not both filled at once.
 */
export function QuoteView({ block }: { block: QuoteBlock }) {
  const { label, quote, source, variant } = block

  if (variant === 'highlight') {
    return <p className="mt-8 bg-teal-deep px-6 py-7 text-lg leading-[1.85] text-primary-foreground/90 sm:px-9">{quote}</p>
  }

  if (variant === 'inline') {
    return (
      <blockquote className="border-s border-gold ps-5 font-serif text-xl leading-[1.8] text-teal-deep">
        {quote}
        {source ? <SourceCitation>{source}</SourceCitation> : null}
      </blockquote>
    )
  }

  if (variant === 'ruled' && label) {
    return (
      <aside className="my-8 border-y border-gold/60 py-7">
        <p className="mb-2 text-sm font-semibold text-gold-ink">{label}</p>
        <p className="font-serif text-xl leading-[1.8] text-teal-deep">{quote}</p>
      </aside>
    )
  }

  const containerClassName =
    variant === 'hero'
      ? 'mt-9 max-w-5xl border-s-4 border-teal bg-background px-5 py-6 sm:px-8 sm:py-7'
      : variant === 'ruled'
        ? 'my-8 border-y border-gold/60 py-7'
        : 'my-8 bg-paper-deep px-5 py-6 sm:px-8 sm:py-7' // boxed

  const blockquoteClassName =
    variant === 'hero'
      ? 'font-serif text-xl leading-[1.8] text-foreground sm:text-2xl sm:leading-[1.8]'
      : variant === 'ruled'
        ? 'font-serif text-lg leading-[1.9] text-teal-deep sm:text-xl'
        : 'font-serif text-lg leading-[1.9] sm:text-xl' // boxed

  return (
    <figure className={containerClassName}>
      <blockquote className={blockquoteClassName}>{quote}</blockquote>
      {source ? <SourceCitation>{source}</SourceCitation> : null}
    </figure>
  )
}
