import { Play } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PressCoverageSection, type PressContent } from '@/components/storefront/PressCoverageSection'
import { RichText } from '@/components/storefront/RichText'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { PageImage } from '@/components/storefront/blocks/PageImage'
import { VideoView } from '@/components/storefront/blocks/VideoView'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { isLocale } from '@/lib/locale'
import { groupPageSections } from '@/lib/pageSections'
import { getPageBySlug } from '@/lib/pagesData'

import type { Media } from '@/payload-types'

// The press archive is curated separately (docs/BACKLOG.md) — not part of
// this page's editable content yet.
const PRESS_CONTENT: Record<string, PressContent> = {
  he: {
    title: 'מן העיתונות',
    introduction: 'סיקור נבחר על הרב שריקי, מפעלו להפצת תורת הרמח״ל ובית המדרש שהקים בירושלים.',
    latestLabel: 'הכתבה האחרונה',
    openLabel: 'לקריאת הכתבה',
    opensInNewTabLabel: 'נפתח באתר חיצוני בחלון חדש',
    externalNote: 'הכתבות מתפרסמות באתרים חיצוניים ונפתחות בחלון חדש.',
  },
  en: {
    title: 'In the press',
    introduction: 'Selected coverage of Rabbi Chriqui, his work sharing the Ramhal’s teachings, and the Jerusalem beit midrash he founded.',
    latestLabel: 'Latest article',
    openLabel: 'Read the article',
    opensInNewTabLabel: 'Opens an external Hebrew website in a new tab',
    externalNote: 'The original articles are in Hebrew and open on external websites in a new tab.',
  },
  fr: {
    title: 'Dans la presse',
    introduction: 'Une sélection d’articles sur le Rav Chriqui, son œuvre de diffusion de la pensée du Ramhal et le beit midrash qu’il a fondé à Jérusalem.',
    latestLabel: 'Article récent',
    openLabel: 'Lire l’article',
    opensInNewTabLabel: 'Ouvre un site hébreu externe dans un nouvel onglet',
    externalNote: 'Les articles originaux sont en hébreu et s’ouvrent sur des sites externes dans un nouvel onglet.',
  },
}

export async function generateMetadata({ params }: PageProps<'/[locale]/rabbi-chriqui'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const page = await getPageBySlug('rabbi-chriqui', locale)
  if (!page) return {}

  return { title: page.title ?? undefined, description: page.metaDescription ?? undefined }
}

export default async function RabbiChriquiPage({ params }: PageProps<'/[locale]/rabbi-chriqui'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const page = await getPageBySlug('rabbi-chriqui', locale)
  if (!page) notFound()

  const [biographySection, videoSection] = groupPageSections(page.content ?? [])
  const biographyBody = biographySection?.body.find((block) => block.blockType === 'richText')
  const secondImage = biographySection?.body.find((block) => block.blockType === 'imageFigure')
  const videoDescription = videoSection?.body.find((block) => block.blockType === 'richText')
  const video = videoSection?.body.find((block) => block.blockType === 'video')
  const heroImage = page.heroImage as Media | null

  return (
    <article>
      <section className="border-b border-border bg-paper-deep">
        <div className="page-container grid items-center gap-10 py-10 md:grid-cols-[1fr_0.72fr] md:gap-14 lg:py-16">
          <div className="flex max-w-2xl flex-col items-start gap-5">
            <Badge variant="outline" className="rounded-[2px] border-gold/70 bg-background/60 px-3 text-gold-ink">
              {page.eyebrow}
            </Badge>
            <h1 className="type-display">{page.title}</h1>
            <p className="text-xl leading-relaxed sm:text-2xl">{page.lead}</p>
            <span aria-hidden className="h-[3px] w-24 bg-gold" />
          </div>

          {heroImage ? (
            <div className="relative mx-auto w-full max-w-sm border border-gold bg-background p-2 shadow-[0_14px_40px_rgb(0_79_88/0.10)] md:max-w-none">
              <AspectRatio ratio={3 / 4} className="overflow-hidden bg-muted">
                <PageImage
                  media={heroImage}
                  alt={page.title ?? ''}
                  fill
                  priority
                  sizes="(min-width: 768px) 36vw, 90vw"
                  className="object-cover"
                />
              </AspectRatio>
              <span aria-hidden className="absolute end-4 -bottom-1 h-[3px] w-24 bg-gold" />
            </div>
          ) : null}
        </div>
      </section>

      <section className="page-container py-14 lg:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.46fr] lg:gap-14">
          <div>
            {biographySection?.heading ? <SectionHeading>{biographySection.heading.heading}</SectionHeading> : null}
            {biographyBody?.blockType === 'richText' ? <RichText content={biographyBody.body} /> : null}
          </div>

          {secondImage?.blockType === 'imageFigure' && secondImage.image ? (
            <figure className="mx-auto w-full max-w-sm border border-border bg-paper-deep p-2 lg:mt-16 lg:max-w-none">
              <AspectRatio ratio={3 / 4} className="overflow-hidden bg-muted">
                <PageImage
                  media={secondImage.image as Media}
                  alt={secondImage.caption ?? ''}
                  fill
                  sizes="(min-width: 1024px) 29vw, 90vw"
                  className="object-cover"
                />
              </AspectRatio>
              {secondImage.caption ? <figcaption className="px-2 pb-1 pt-3 text-sm text-muted-foreground">{secondImage.caption}</figcaption> : null}
            </figure>
          ) : null}
        </div>
      </section>

      {videoSection?.heading ? (
        <section className="border-y border-border bg-paper-deep">
          <div className="page-container py-14 lg:py-16">
            <div className="mb-8 flex max-w-3xl flex-col items-start gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-teal">
                <Play aria-hidden className="size-4 fill-current" />
                {videoSection.heading.kicker}
              </p>
              <h2 className="type-heading text-teal-deep">{videoSection.heading.heading}</h2>
              {videoDescription?.blockType === 'richText' ? (
                <RichText content={videoDescription.body} className="text-lg leading-relaxed text-muted-foreground" />
              ) : null}
            </div>

            {video?.blockType === 'video' ? <VideoView block={video} /> : null}
          </div>
        </section>
      ) : null}

      <PressCoverageSection content={PRESS_CONTENT[locale]} locale={locale} />
    </article>
  )
}
