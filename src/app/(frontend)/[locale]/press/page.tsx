import { ArrowUpLeft, LibraryBig } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { PressArticleCard } from '@/components/storefront/PressArticleCard'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { isLocale, LOCALE_CONFIG } from '@/lib/locale'
import { PRESS_ARTICLES_NEWEST_FIRST } from '@/lib/pressCoverage'
import { cn } from '@/lib/utils'

import type { Locale } from '@/lib/locale'

const PAGE_CONTENT: Record<Locale, {
  title: string
  eyebrow: string
  introduction: string
  metadataDescription: string
  archiveTitle: string
  latestLabel: string
  articleCount: (count: number) => string
  openLabel: string
  opensInNewTabLabel: string
  externalNote: string
  imageAlt: string
}> = {
  he: {
    title: 'כתבות בתקשורת',
    eyebrow: 'מן העיתונות',
    introduction: 'סיקור נבחר על הרמח״ל, הרב מרדכי שריקי ובית רמח״ל — מן הארכיון ועד הכתבות האחרונות.',
    metadataDescription: 'כתבות וסיקור תקשורתי על הרמח״ל, הרב מרדכי שריקי, מכון רמח״ל ובית רמח״ל.',
    archiveTitle: 'עוד כתבות',
    latestLabel: 'הכתבה האחרונה',
    articleCount: (count) => `${count} כתבות נבחרות`,
    openLabel: 'לקריאת הכתבה',
    opensInNewTabLabel: 'נפתח באתר חיצוני בחלון חדש',
    externalNote: 'הכתבות מתפרסמות באתרים חיצוניים ונפתחות בחלון חדש.',
    imageAlt: 'הרב מרדכי שריקי נושא דברים בבית רמח״ל',
  },
  en: {
    title: 'In the press',
    eyebrow: 'Press coverage',
    introduction: 'Selected coverage of the Ramhal, Rabbi Mordechai Chriqui, and Beit Ramhal — from the archive to the latest reports.',
    metadataDescription: 'Press coverage of the Ramhal, Rabbi Mordechai Chriqui, Machon Ramhal, and Beit Ramhal.',
    archiveTitle: 'More coverage',
    latestLabel: 'Latest article',
    articleCount: (count) => `${count} selected articles`,
    openLabel: 'Read the article',
    opensInNewTabLabel: 'Opens an external Hebrew website in a new tab',
    externalNote: 'The original articles are in Hebrew and open on external websites in a new tab.',
    imageAlt: 'Rabbi Mordechai Chriqui speaking at Beit Ramhal',
  },
  fr: {
    title: 'Dans la presse',
    eyebrow: 'Revue de presse',
    introduction: 'Une sélection d’articles sur le Ramhal, le Rav Mordekhaï Chriqui et Beit Ramhal — des archives aux publications récentes.',
    metadataDescription: 'Revue de presse consacrée au Ramhal, au Rav Mordekhaï Chriqui, à l’Institut Ramhal et à Beit Ramhal.',
    archiveTitle: 'Autres articles',
    latestLabel: 'Article récent',
    articleCount: (count) => `${count} articles sélectionnés`,
    openLabel: 'Lire l’article',
    opensInNewTabLabel: 'Ouvre un site hébreu externe dans un nouvel onglet',
    externalNote: 'Les articles originaux sont en hébreu et s’ouvrent sur des sites externes dans un nouvel onglet.',
    imageAlt: 'Le Rav Mordekhaï Chriqui prend la parole à Beit Ramhal',
  },
}

function formatPublicationDate(publishedAt: string, intlTag: string): string {
  return new Intl.DateTimeFormat(intlTag, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${publishedAt}T12:00:00Z`),
  )
}

export async function generateMetadata({ params }: PageProps<'/[locale]/press'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  return { title: PAGE_CONTENT[locale].title, description: PAGE_CONTENT[locale].metadataDescription }
}

export default async function PressPage({ params }: PageProps<'/[locale]/press'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const content = PAGE_CONTENT[locale]
  const { intlTag } = LOCALE_CONFIG[locale]
  const [latestArticle, ...archiveArticles] = PRESS_ARTICLES_NEWEST_FIRST

  return (
    <article>
      <section className="border-b border-border bg-paper-deep">
        <div className="page-container grid items-stretch gap-8 py-10 md:grid-cols-[1.05fr_0.95fr] md:gap-12 lg:py-16">
          <div className="flex flex-col items-start justify-center gap-5">
            <Badge variant="outline" className="rounded-[2px] border-gold/70 bg-background/70 px-3 text-gold-ink">
              <LibraryBig aria-hidden />
              {content.eyebrow}
            </Badge>
            <h1 className="type-display">{content.title}</h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">{content.introduction}</p>
            <p className="flex items-center gap-3 text-sm font-medium text-teal-deep">
              <span aria-hidden className="h-[3px] w-12 bg-gold" />
              {content.articleCount(PRESS_ARTICLES_NEWEST_FIRST.length)}
            </p>
          </div>

          <div className="relative border border-gold bg-background p-2 shadow-[0_14px_40px_rgb(0_79_88/0.10)]">
            <AspectRatio ratio={4 / 3} className="overflow-hidden bg-muted">
              <Image
                src="/donate/rabbi-chriqui-speaking.webp"
                alt={content.imageAlt}
                fill
                priority
                sizes="(min-width: 768px) 44vw, 94vw"
                className="object-cover"
              />
            </AspectRatio>
            <span aria-hidden className="absolute end-4 -bottom-1 h-[3px] w-24 bg-gold" />
          </div>
        </div>
      </section>

      <section className="page-container py-12 lg:py-16">
        <div className="grid overflow-hidden rounded-sm border border-border bg-card lg:grid-cols-[0.36fr_0.64fr]">
          <div className="flex flex-col justify-between gap-8 border-b border-border bg-teal-deep p-6 text-paper lg:border-b-0 lg:border-e">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-paper/75">{content.latestLabel}</p>
              <p className="type-title text-paper">{latestArticle.outlet}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-paper/75">
              <Badge variant="outline" className="rounded-[2px] border-gold/70 text-paper">
                {latestArticle.topic[locale]}
              </Badge>
              <time dateTime={latestArticle.publishedAt}>{formatPublicationDate(latestArticle.publishedAt, intlTag)}</time>
            </div>
          </div>
          <div className="flex flex-col items-start gap-5 p-6 sm:p-8 lg:p-10">
            <h2 className="type-title" lang="he" dir="rtl">{latestArticle.title}</h2>
            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">{latestArticle.summary[locale]}</p>
            <a
              href={latestArticle.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${content.openLabel}: ${latestArticle.title}. ${content.opensInNewTabLabel}`}
              className={cn(buttonVariants({ size: 'lg' }), 'mt-auto')}
            >
              {content.openLabel}
              <ArrowUpLeft aria-hidden className="ltr:-scale-x-100" />
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-paper-deep/70">
        <div className="page-container py-12 lg:py-16">
          <SectionHeading>{content.archiveTitle}</SectionHeading>
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
    </article>
  )
}
