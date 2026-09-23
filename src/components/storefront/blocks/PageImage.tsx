import Image from 'next/image'

import type { Media } from '@/payload-types'
import type { ComponentProps } from 'react'

type PageImageProps = {
  alt: string
  className?: string
  media: Media
  priority?: boolean
  sizes: string
} & Pick<ComponentProps<typeof Image>, 'fill'>

/** A Payload Media image at its `full` size, falling back to the original
 * upload — the same resolution `CoverImage.tsx` uses for book covers. */
export function PageImage({ alt, media, ...imageProps }: PageImageProps) {
  const src = media.sizes?.full?.url ?? media.url
  if (!src) return null

  return <Image alt={media.alt || alt} src={src} {...imageProps} />
}
