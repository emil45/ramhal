import { MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RichText } from '@/components/storefront/RichText'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { GalleryView } from '@/components/storefront/blocks/GalleryView'
import { FeatureCardsView } from '@/components/storefront/blocks/FeatureCardsView'
import { PageImage } from '@/components/storefront/blocks/PageImage'
import { StatGridView } from '@/components/storefront/blocks/StatGridView'
import { TagListView } from '@/components/storefront/blocks/TagListView'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { isLocale } from '@/lib/locale'
import { groupPageSections } from '@/lib/pageSections'
import { getPageBySlug } from '@/lib/pagesData'
import { localePath } from '@/lib/routes'

import type { Media } from '@/payload-types'

export async function generateMetadata({ params }: PageProps<'/[locale]/beit-ramhal'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const page = await getPageBySlug('beit-ramhal', locale)
  if (!page) return {}

  return { title: page.title ?? undefined, description: page.metaDescription ?? undefined }
}

export default async function BeitRamhalPage({ params }: PageProps<'/[locale]/beit-ramhal'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const page = await getPageBySlug('beit-ramhal', locale)
  if (!page) notFound()

  const dict = getDictionary(locale)
  const scheduleHref = `${localePath(locale, '/')}#schedule`
  const heroImage = page.heroImage as Media | null

  const [statsAndStudy, synagogue, building, gallery, closing] = groupPageSections(page.content ?? [])
  const statGrid = statsAndStudy?.body.find((block) => block.blockType === 'statGrid')
  const midrashBody = statsAndStudy?.body.find((block) => block.blockType === 'richText')
  const tagList = statsAndStudy?.body.find((block) => block.blockType === 'tagList')
  const synagogueImage = synagogue?.body.find((block) => block.blockType === 'imageFigure')
  const synagogueBody = synagogue?.body.find((block) => block.blockType === 'richText')
  const featureCards = building?.body.find((block) => block.blockType === 'featureCards')
  const galleryDescription = gallery?.body.find((block) => block.blockType === 'richText')
  const galleryBlock = gallery?.body.find((block) => block.blockType === 'gallery')
  const closingBody = closing?.body.find((block) => block.blockType === 'richText')
  const [exteriorImage, arkImage] = closing?.body.filter((block) => block.blockType === 'imageFigure') ?? []

  return (
    <article>
      <section className="border-b border-border bg-paper-deep">
        <div className="page-container grid items-center gap-10 py-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14 lg:py-16">
          <div className="flex flex-col items-start gap-5">
            <Badge variant="outline" className="rounded-[2px] border-gold/70 bg-background/60 px-3 text-gold-ink">
              {page.eyebrow}
            </Badge>
            <h1 className="type-display">{page.title}</h1>
            <p className="max-w-xl text-xl leading-relaxed text-foreground sm:text-2xl">{page.lead}</p>
            {page.location ? (
              <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-ink" />
                <span>{page.location}</span>
              </p>
            ) : null}
          </div>

          {heroImage ? (
            <div className="relative border border-gold bg-background p-2 shadow-[0_14px_40px_rgb(0_79_88/0.10)]">
              <AspectRatio ratio={16 / 9} className="overflow-hidden bg-muted">
                <PageImage media={heroImage} alt={page.title ?? ''} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
              </AspectRatio>
              <span aria-hidden className="absolute end-4 -bottom-1 h-[3px] w-24 bg-gold" />
            </div>
          ) : null}
        </div>
      </section>

      {statGrid?.blockType === 'statGrid' ? (
        <div className="page-container pt-12">
          <StatGridView block={statGrid} />
        </div>
      ) : null}

      <section className="page-container py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
          <div>
            {statsAndStudy?.heading ? <SectionHeading>{statsAndStudy.heading.heading}</SectionHeading> : null}
            {midrashBody?.blockType === 'richText' ? <RichText content={midrashBody.body} className="max-w-2xl gap-5 text-lg leading-[1.8]" /> : null}
          </div>

          {tagList?.blockType === 'tagList' ? <TagListView block={tagList} /> : null}
        </div>
      </section>

      <section className="border-y border-border bg-paper-deep">
        <div className="page-container grid items-center gap-10 py-16 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
          {synagogueImage?.blockType === 'imageFigure' && synagogueImage.image ? (
            <figure className="border border-gold bg-background p-2">
              <AspectRatio ratio={1280 / 856} className="overflow-hidden bg-muted">
                <PageImage
                  media={synagogueImage.image as Media}
                  alt={synagogueImage.caption ?? ''}
                  fill
                  sizes="(min-width: 1024px) 54vw, 100vw"
                  className="object-cover"
                />
              </AspectRatio>
            </figure>
          ) : null}

          <div>
            {synagogue?.heading ? <SectionHeading>{synagogue.heading.heading}</SectionHeading> : null}
            {synagogueBody?.blockType === 'richText' ? <RichText content={synagogueBody.body} className="gap-5 text-lg leading-[1.8]" /> : null}
          </div>
        </div>
      </section>

      <section className="page-container py-16">
        {building?.heading ? <SectionHeading>{building.heading.heading}</SectionHeading> : null}
        {featureCards?.blockType === 'featureCards' ? <FeatureCardsView block={featureCards} /> : null}
      </section>

      <section className="border-y border-border bg-paper-deep">
        <div className="page-container py-16">
          {gallery?.heading ? <SectionHeading>{gallery.heading.heading}</SectionHeading> : null}
          {galleryDescription?.blockType === 'richText' ? (
            <RichText content={galleryDescription.body} className="mb-8 max-w-2xl gap-0 text-lg leading-relaxed text-muted-foreground" />
          ) : null}
          {galleryBlock?.blockType === 'gallery' ? (
            <GalleryView
              block={galleryBlock}
              locale={locale}
              label={gallery?.heading?.heading ?? ''}
              previousLabel={dict.gallery.previousImage}
              nextLabel={dict.gallery.nextImage}
            />
          ) : null}
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="page-container grid items-start gap-8 py-16 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col">
            {exteriorImage?.blockType === 'imageFigure' && exteriorImage.image ? (
              <figure className="border border-gold bg-paper-deep p-2">
                <AspectRatio ratio={3 / 4} className="overflow-hidden bg-muted">
                  <PageImage
                    media={exteriorImage.image as Media}
                    alt={exteriorImage.caption ?? ''}
                    fill
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    className="object-cover"
                  />
                </AspectRatio>
              </figure>
            ) : null}
            <div className="flex flex-col items-start gap-5 border-x border-b border-border bg-paper-deep px-6 py-8">
              {closing?.heading ? <h2 className="type-heading">{closing.heading.heading}</h2> : null}
              {closingBody?.blockType === 'richText' ? (
                <RichText content={closingBody.body} className="gap-0 text-lg leading-relaxed text-muted-foreground" />
              ) : null}
              <Separator className="bg-gold/50" />
              <Link href={scheduleHref} className={buttonVariants({ size: 'lg' })}>
                {dict.pages.viewSchedule}
              </Link>
            </div>
          </div>

          {arkImage?.blockType === 'imageFigure' && arkImage.image ? (
            <figure className="border border-gold bg-paper-deep p-2">
              <AspectRatio ratio={2 / 3} className="overflow-hidden bg-muted">
                <PageImage
                  media={arkImage.image as Media}
                  alt={arkImage.caption ?? ''}
                  fill
                  sizes="(min-width: 1024px) 57vw, 100vw"
                  className="object-cover object-[center_42%]"
                />
              </AspectRatio>
            </figure>
          ) : null}
        </div>
      </section>
    </article>
  )
}
