'use client'

import Image from 'next/image'
import { useState } from 'react'

import { CoverImage } from '@/components/storefront/CoverImage'
import { Button } from '@/components/ui/button'
import { cn } from 'cn'

import type { CoverIdentity } from '@/lib/cover'
import type { Media } from '@/payload-types'

type BookImageGalleryProps = {
  book: CoverIdentity
  /** Cover first, then the gallery — see collectBookImages. */
  images: Media[]
  /** Accessible name of the thumbnail strip, e.g. "Book images". */
  label: string
  sizes: string
  /** One per image — pre-rendered because a function cannot cross from the server page into this component. */
  thumbnailLabels: string[]
  title: string
}

/**
 * The cover, with — when the book has more pictures — a quiet row of
 * thumbnails under it that swaps what the frame shows. No lightbox and no
 * autoplay: a visitor looking at a book wants to turn it over, not be shown a
 * slideshow. A book with one picture, or none, renders exactly as before.
 */
export function BookImageGallery({ book, images, label, sizes, thumbnailLabels, title }: BookImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = images[selectedIndex] ?? null

  return (
    <div className="flex flex-col gap-4">
      <CoverImage book={book} cover={selected} sizes={sizes} title={title} />

      {images.length > 1 ? (
        <ul aria-label={label} className="flex flex-wrap justify-center gap-2 md:justify-start">
          {images.map((image, index) => {
            const src = image.sizes?.thumbnail?.url ?? image.url
            if (!src) return null
            const isSelected = index === selectedIndex
            return (
              <li key={image.id}>
                <Button
                  variant="ghost"
                  aria-label={thumbnailLabels[index]}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    'relative h-16 w-12 rounded-[2px] bg-paper-deep p-0 ring-1 ring-transparent transition-[opacity,box-shadow] hover:bg-paper-deep',
                    isSelected ? 'ring-teal' : 'opacity-60 hover:opacity-100',
                  )}
                >
                  <Image src={src} alt="" fill sizes="48px" className="object-contain p-0.5" />
                </Button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
