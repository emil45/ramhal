import { PageImage } from './PageImage'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

import type { Media, Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'

type GalleryBlock = Extract<NonNullable<Page['content']>[number], { blockType: 'gallery' }>

export function GalleryView({
  block,
  label,
  locale,
  nextLabel,
  previousLabel,
}: {
  block: GalleryBlock
  label: string
  locale: Locale
  nextLabel: string
  previousLabel: string
}) {
  const items = block.items ?? []

  return (
    <Carousel aria-label={label} opts={{ align: 'start', direction: locale === 'he' ? 'rtl' : 'ltr', loop: true }}>
      <CarouselContent>
        {items.map((item) => {
          const image = item.image as Media
          return (
            <CarouselItem key={item.id} className="basis-[88%] sm:basis-1/2 lg:basis-1/3">
              <figure className="overflow-hidden rounded-[2px] border border-gold bg-card">
                <AspectRatio ratio={4 / 3} className="overflow-hidden bg-muted">
                  <PageImage
                    media={image}
                    alt={item.caption}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 88vw"
                    className="object-cover"
                  />
                </AspectRatio>
                <figcaption className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{item.caption}</figcaption>
              </figure>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious label={previousLabel} />
      <CarouselNext label={nextLabel} />
    </Carousel>
  )
}
