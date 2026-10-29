'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { CoverImage } from '@/components/storefront/CoverImage'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from 'cn'

import type { CoverIdentity } from '@/lib/cover'
import type { Media } from '@/payload-types'

type BookImageGalleryProps = {
  book: CoverIdentity
  /** Cover first, then the gallery — see collectBookImages. */
  images: Media[]
  /** Text for assistive technology and tooltips, already in the page's language: functions cannot cross from the server page into this component. */
  labels: {
    close: string
    images: string
    next: string
    previous: string
    zoom: string
  }
  /** One per image, e.g. "Image 2 of 3". */
  thumbnailLabels: string[]
  direction: 'ltr' | 'rtl'
  sizes: string
  title: string
}

/**
 * The cover, with — when the book has more pictures — a quiet row of
 * thumbnails under it that swaps what the frame shows. Clicking the picture
 * opens it large in a dialog, where the same pictures can be paged through. No
 * autoplay: a visitor looking at a book wants to turn it over, not be shown a
 * slideshow. A book with one picture renders the same, without the thumbnails;
 * one with none shows the typeset cover and nothing to open.
 */
export function BookImageGallery({ book, direction, images, labels, sizes, thumbnailLabels, title }: BookImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = images[selectedIndex] ?? null
  const hasSeveralImages = images.length > 1

  function step(offset: number) {
    setSelectedIndex((index) => (index + offset + images.length) % images.length)
  }

  // Left and right arrow keys follow the picture's reading direction: in
  // Hebrew the next picture is to the left.
  function handleKeyDown(event: React.KeyboardEvent) {
    if (!hasSeveralImages) return
    const forwardKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const backwardKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forwardKey) step(1)
    if (event.key === backwardKey) step(-1)
  }

  const frame = <CoverImage book={book} cover={selected} sizes={sizes} title={title} />

  return (
    <div className="flex flex-col gap-4">
      {selected ? (
        <Dialog>
          <DialogTrigger nativeButton={false} aria-label={labels.zoom} render={<div className="cursor-zoom-in rounded-[2px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />}>
            {frame}
          </DialogTrigger>
          <DialogContent
            closeLabel={labels.close}
            onKeyDown={handleKeyDown}
            className="h-[min(90vh,60rem)] w-[min(94vw,52rem)] max-w-none bg-paper-deep p-2 sm:max-w-none"
          >
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <div className="relative size-full">
              <Image src={selected.sizes?.full?.url ?? selected.url ?? ''} alt={selected.alt || title} fill sizes="(min-width: 832px) 52rem, 94vw" className="object-contain" />
            </div>
            {hasSeveralImages ? (
              <>
                <Button variant="ghost" size="icon" aria-label={labels.previous} onClick={() => step(-1)} className="absolute start-2 top-1/2 -translate-y-1/2 bg-paper-deep/80">
                  <ChevronLeft className="rtl:rotate-180" aria-hidden />
                </Button>
                <Button variant="ghost" size="icon" aria-label={labels.next} onClick={() => step(1)} className="absolute end-2 top-1/2 -translate-y-1/2 bg-paper-deep/80">
                  <ChevronRight className="rtl:rotate-180" aria-hidden />
                </Button>
                <p dir="ltr" aria-live="polite" className="absolute inset-x-0 bottom-2 text-center text-xs text-muted-foreground">
                  {selectedIndex + 1} / {images.length}
                </p>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      ) : (
        frame
      )}

      {hasSeveralImages ? (
        <ul aria-label={labels.images} className="flex flex-wrap justify-center gap-2 md:justify-start">
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
