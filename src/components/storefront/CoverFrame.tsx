import { AspectRatio } from '@/components/ui/aspect-ratio'
import { COVER_ASPECT_RATIO } from '@/lib/books/cover'

import type { ReactNode } from 'react'

/**
 * The shelf every book stands on: one paper-deep tile at 2:3, the ground the
 * product photographs were shot against, so a photo and a typeset cover sit
 * side by side as one row of books. No border and no inner frame — the book
 * is the picture, at the largest size the tile allows. Children are sized in
 * `cqw` (a percentage of this tile's own width), so it scales from a cart
 * thumbnail to the book page without a breakpoint.
 */
export function CoverFrame({ children }: { children: ReactNode }) {
  return (
    <AspectRatio ratio={COVER_ASPECT_RATIO} className="@container relative overflow-hidden rounded-[2px] bg-paper-deep">
      {children}
    </AspectRatio>
  )
}
