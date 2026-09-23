import { ArrowUpLeft } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { Locale } from '@/lib/locale'
import type { PressArticle } from '@/lib/pressCoverage'

type PressArticleCardProps = {
  article: PressArticle
  dateLabel: string
  locale: Locale
  openLabel: string
  opensInNewTabLabel: string
}

export function PressArticleCard({ article, dateLabel, locale, openLabel, opensInNewTabLabel }: PressArticleCardProps) {
  return (
    <Card className="h-full gap-0 rounded-sm bg-card py-0 shadow-none ring-border transition-colors hover:ring-gold/70">
      <CardHeader className="gap-4 rounded-none border-b border-border px-5 py-5 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-[2px] border-gold/70 bg-paper-deep text-gold-ink">
            {article.outlet}
          </Badge>
          <Badge variant="secondary" className="rounded-[2px]">
            {article.topic[locale]}
          </Badge>
        </div>
        <CardAction>
          <time dateTime={article.publishedAt} className="whitespace-nowrap text-xs text-muted-foreground">
            {dateLabel}
          </time>
        </CardAction>
        <CardTitle className="type-subheading! col-span-2 mt-1 text-teal-deep" lang="he" dir="rtl">
          {article.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-5 py-5 sm:px-6">
        <p className="leading-relaxed text-muted-foreground">{article.summary[locale]}</p>
      </CardContent>
      <CardFooter className="justify-start rounded-none border-t border-border bg-paper-deep/60 px-5 py-4 sm:px-6">
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`${openLabel}: ${article.title}. ${opensInNewTabLabel}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'border-teal/40 bg-background text-teal-deep')}
        >
          {openLabel}
          <ArrowUpLeft aria-hidden className="size-3.5 ltr:-scale-x-100" />
        </a>
      </CardFooter>
    </Card>
  )
}
