import Image from 'next/image'

import { CoverFrame } from '@/components/storefront/CoverFrame'
import { TypographicCover } from '@/components/storefront/TypographicCover'

import type { CoverIdentity } from '@/lib/books/cover'
import type { Media } from '@/payload-types'

type CoverImageProps = {
  book: CoverIdentity
  cover: Media | null | undefined
  sizes: string
  title: string
  priority?: boolean
}

/** Real covers through next/image, on the same shelf as a typeset cover;
 * without one, the typeset cover — never an empty box. */
export function CoverImage({ book, cover, sizes, title, priority = false }: CoverImageProps) {
  const src = cover?.sizes?.card?.url ?? cover?.url
  if (!src || !cover?.width || !cover?.height) {
    return <TypographicCover book={book} title={title} />
  }

  return (
    <CoverFrame>
      {/* `contain`, not `cover`: supplied covers range from portrait jackets
          to full wrap-around spreads, and cropping any of them to 2:3 would
          cut the title. */}
      <div className="absolute inset-[4cqw] transition-transform duration-300 ease-out group-hover/cover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/cover:scale-100">
        <Image src={src} alt={cover.alt || title} fill sizes={sizes} priority={priority} className="object-contain" />
      </div>
    </CoverFrame>
  )
}
