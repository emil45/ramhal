import type { ReactNode } from 'react'

import { SectionHeading } from '@/components/storefront/SectionHeading'

export type ContentsItem = {
  href: `#${string}`
  label: string
}

export function SourceCitation({ children }: { children: ReactNode }) {
  return <cite className="mt-5 block text-sm font-normal not-italic text-gold-ink">{children}</cite>
}

export function RamhalArticleLayout({ children, contents, contentsLabel, eyebrow, introduction, quote, quoteSource, title }: {
  children: ReactNode
  contents: readonly ContentsItem[]
  contentsLabel: string
  eyebrow: string
  introduction: string
  quote: ReactNode
  quoteSource: string
  title: string
}) {
  return (
    <article className="pb-16 sm:pb-20">
      <header className="border-b border-border bg-paper-deep/55">
        <div className="page-container py-10 sm:py-14">
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-semibold tracking-[0.12em] text-gold-ink">{eyebrow}</p>
            <SectionHeading as="h1">{title}</SectionHeading>
            <p className="max-w-3xl font-serif text-xl leading-[1.75] text-teal-deep sm:text-2xl">{introduction}</p>
          </div>

          <figure className="mt-9 max-w-5xl border-s-4 border-teal bg-background px-5 py-6 sm:px-8 sm:py-7">
            <blockquote className="font-serif text-xl leading-[1.8] text-foreground sm:text-2xl sm:leading-[1.8]">{quote}</blockquote>
            <SourceCitation>{quoteSource}</SourceCitation>
          </figure>
        </div>
      </header>

      <div className="page-container mt-10 grid items-start gap-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16">
        <nav aria-label={contentsLabel} className="border-y border-border py-5 lg:sticky lg:top-6">
          <p className="font-serif text-lg font-semibold text-teal-deep">{contentsLabel}</p>
          <ol className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
            {contents.map((item, index) => (
              <li key={item.href}>
                <a className="group flex items-baseline gap-3 text-muted-foreground transition-colors hover:text-teal" href={item.href}>
                  <span aria-hidden className="font-serif text-xs text-gold-ink">{String(index + 1).padStart(2, '0')}</span>
                  <span className="decoration-gold underline-offset-4 group-hover:underline">{item.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 max-w-4xl">{children}</div>
      </div>
    </article>
  )
}

export function ArticleSection({ children, first = false, id, kicker, ornament, title }: {
  children: ReactNode
  first?: boolean
  id: string
  kicker?: string
  ornament?: string
  title: string
}) {
  return (
    <section id={id} className={`scroll-mt-8 ${first ? '' : 'mt-12 border-t border-border pt-10'}`}>
      {ornament ? <p className="mb-2 font-serif text-4xl leading-none text-gold-ink" aria-hidden>{ornament}</p> : null}
      {kicker ? <p className="mb-2 text-sm font-semibold text-gold-ink">{kicker}</p> : null}
      <h2 className="type-heading">{title}</h2>
      {children}
    </section>
  )
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="type-prose mt-5 flex flex-col gap-5 text-lg">{children}</div>
}
