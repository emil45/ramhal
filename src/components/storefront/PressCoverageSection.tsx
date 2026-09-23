import { ArrowUpLeft } from 'lucide-react'

import { PressArticleCard } from '@/components/storefront/PressArticleCard'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LOCALE_CONFIG } from '@/lib/locale'
import { PRESS_ARTICLES_NEWEST_FIRST } from '@/lib/pressCoverage'
import { cn } from '@/lib/utils'

import type { Locale } from '@/lib/locale'

export type PressContent = {
  title: string
  introduction: string
  latestLabel: string
  openLabel: string
  opensInNewTabLabel: string
  externalNote: string
}

type PressCoverageSectionProps = {
  content: PressContent
  locale: Locale
}

function formatPublicationDate(publishedAt: string, intlTag: string): string {
  return new Intl.DateTimeFormat(intlTag, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${publishedAt}T12:00:00Z`),
  )
}

export function PressCoverageSection({ content, locale }: PressCoverageSectionProps) {
  const { intlTag } = LOCALE_CONFIG[locale]
  const [latestArticle, ...archiveArticles] = PRESS_ARTICLES_NEWEST_FIRST

  return (
    <section id="press" className="scroll-mt-8 border-y border-border bg-paper-deep/70">
      <div className="page-container py-14 lg:py-16">
        <SectionHeading>{content.title}</SectionHeading>
        <p className="mb-8 max-w-3xl text-lg leading-relaxed text-muted-foreground">{content.introduction}</p>

        <Card className="mb-5 grid gap-0 overflow-hidden rounded-sm py-0 shadow-none ring-border lg:grid-cols-[0.32fr_0.68fr]">
          <div className="flex flex-col justify-between gap-8 border-b border-border bg-background p-6 lg:border-b-0 lg:border-e">
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm font-semibold text-teal">{content.latestLabel}</p>
              <p className="type-heading">{latestArticle.outlet}</p>
            </div>
            <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="rounded-[2px] border-gold/70 bg-paper-deep text-gold-ink">
                {latestArticle.topic[locale]}
              </Badge>
              <time dateTime={latestArticle.publishedAt}>{formatPublicationDate(latestArticle.publishedAt, intlTag)}</time>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 p-6 sm:p-8">
            <h3 className="type-heading" lang="he" dir="rtl">{latestArticle.title}</h3>
            <p className="max-w-3xl leading-relaxed text-muted-foreground">{latestArticle.summary[locale]}</p>
            <a
              href={latestArticle.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${content.openLabel}: ${latestArticle.title}. ${content.opensInNewTabLabel}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-auto border-teal/40 bg-background text-teal-deep')}
            >
              {content.openLabel}
              <ArrowUpLeft aria-hidden className="size-3.5 ltr:-scale-x-100" />
            </a>
          </div>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          {archiveArticles.map((article) => (
            <PressArticleCard
              key={article.id}
              article={article}
              dateLabel={formatPublicationDate(article.publishedAt, intlTag)}
              locale={locale}
              openLabel={content.openLabel}
              opensInNewTabLabel={content.opensInNewTabLabel}
            />
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">{content.externalNote}</p>
      </div>
    </section>
  )
}
