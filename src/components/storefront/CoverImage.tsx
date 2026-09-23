import Image from 'next/image'

import { CoverFrame } from '@/components/storefront/CoverFrame'
import { TypographicCover } from '@/components/storefront/TypographicCover'

import type { CoverIdentity } from '@/lib/cover'
import type { Media } from '@/payload-types'

type CoverImageProps = {
  book: CoverIdentity
  cover: Media | null | undefined
  sizes: string
  title: string
}

/** Real covers through next/image, set inside the same frame as a typeset
 * cover; without one, the typeset cover — never an empty box. */
export function CoverImage({ book, cover, sizes, title }: CoverImageProps) {
  const src = cover?.sizes?.card?.url ?? cover?.url
  if (!src || !cover?.width || !cover?.height) {
    return <TypographicCover book={book} title={title} />
  }

  return (
    <CoverFrame book={book}>
      {/* `contain`, not `cover`: supplied covers range from portrait jackets
          to full wrap-around spreads, and cropping any of them to 2:3 would
          cut the title. */}
      <div className="relative m-[1.6cqw] flex-1">
        <Image src={src} alt={cover.alt || title} fill sizes={sizes} className="object-contain" />
      </div>
    </CoverFrame>
  )
}
