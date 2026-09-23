import { slugify } from '@/lib/slugify'

import { ArticleBodyBlock } from '@/components/storefront/blocks/ArticleBodyBlock'
import { RichText } from '@/components/storefront/RichText'

import type { PageSection } from '@/lib/pageSections'

/** One section of the article: a heading in the "article" style, followed
 * by its flowing content — or the closing "concluding" band, which is a
 * different visual treatment entirely, not a variant of the same markup. */
export function RamhalSection({ first, section }: { first: boolean; section: PageSection }) {
  const heading = section.heading
  if (!heading) {
    return <>{section.body.map((block, index) => <ArticleBodyBlock key={index} block={block as never} />)}</>
  }

  const id = slugify(heading.heading)

  if (heading.style === 'concluding') {
    return (
      <section id={id} className="scroll-mt-8 mt-12 bg-teal-deep px-6 py-8 text-primary-foreground sm:px-9 sm:py-10">
        {heading.kicker ? <p className="mb-2 text-sm font-semibold text-gold">{heading.kicker}</p> : null}
        <h2 className="font-serif text-2xl font-bold leading-tight sm:text-3xl">{heading.heading}</h2>
        {section.body.map((block, index) =>
          block.blockType === 'richText' ? (
            <RichText key={index} className="mt-5 text-lg leading-[1.9] text-primary-foreground/90" content={block.body} />
          ) : (
            <ArticleBodyBlock key={index} block={block as never} />
          ),
        )}
      </section>
    )
  }

  return (
    <section id={id} className={`scroll-mt-8 ${first ? '' : 'mt-12 border-t border-border pt-10'}`}>
      {heading.ornament ? (
        <p aria-hidden className="mb-2 font-serif text-4xl leading-none text-gold-ink">
          {heading.ornament}
        </p>
      ) : null}
      {heading.kicker ? <p className="mb-2 text-sm font-semibold text-gold-ink">{heading.kicker}</p> : null}
      <h2 className="type-heading">{heading.heading}</h2>
      {section.body.map((block, index) => (
        <ArticleBodyBlock key={index} block={block as never} />
      ))}
    </section>
  )
}
