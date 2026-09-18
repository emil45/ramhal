import Image from 'next/image'

import { TypographicCover } from '@/components/storefront/TypographicCover'

import type { Media } from '@/payload-types'

type CoverImageProps = {
  categorySlug: string | null | undefined
  cover: Media | null | undefined
  sizes: string
  title: string
}

/** Real covers through next/image; the fallback is rendered, never an image
 * file (docs/tasks/TASK-06-storefront.md §5). */
export function CoverImage({ categorySlug, cover, sizes, title }: CoverImageProps) {
  const src = cover?.sizes?.card?.url ?? cover?.url
  if (!src || !cover?.width || !cover?.height) {
    return <TypographicCover categorySlug={categorySlug} title={title} />
  }

  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm bg-secondary">
      <Image
        src={src}
        alt={cover.alt || title}
        fill
        sizes={sizes}
        className="object-cover"
      />
    </div>
  )
}
