import { cn } from '@/lib/utils'

import type { Dictionary } from '@/app/(frontend)/dictionary'

/**
 * The marks on a book that is new or on sale, borrowed from the books
 * themselves rather than from a sticker sheet. "New" is a ribbon bookmark
 * hanging from the top edge, as a sefer's own ribbon does; "sale" is a round
 * seal in the gold of the covers' foil, lettered in ink (gold is too light
 * behind paper-coloured text), tilted as if pressed by hand. Each
 * sits in its own corner, so a book that is both carries both.
 */
export function BookBadges({
  dict,
  isNew,
  percentOff,
  size = 'card',
}: {
  dict: Dictionary
  isNew: boolean
  percentOff: number | null
  /** `page` for the single large cover on a book's own page. */
  size?: 'card' | 'page'
}) {
  const large = size === 'page'

  return (
    <>
      {isNew ? (
        <span
          aria-label={dict.book.newBadge}
          className={cn(
            'pointer-events-none absolute start-[6%] top-0 z-10 flex justify-center bg-teal-deep leading-none font-semibold text-paper shadow-[0_2px_4px_rgb(0_0_0/0.25)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_80%,0_100%)]',
            large ? 'h-24 w-16 pt-4 text-lg' : 'h-16 w-11 pt-2.5 text-sm md:h-[4.5rem] md:w-12',
          )}
        >
          <span aria-hidden>{dict.book.newBadge}</span>
        </span>
      ) : null}
      {percentOff !== null ? (
        <span
          className={cn(
            'pointer-events-none absolute end-[5%] top-[3%] z-10 flex -rotate-12 flex-col items-center justify-center rounded-full bg-gold text-foreground shadow-[0_3px_8px_-2px_rgb(0_0_0/0.45)] ring-1 ring-foreground/40 ring-inset outline-2 outline-offset-[-6px] outline-foreground/25 outline-dashed',
            large ? 'size-24 md:size-28' : 'size-16 md:size-[4.5rem]',
          )}
        >
          <span className={cn('leading-none font-semibold', large ? 'text-base' : 'text-xs')}>{dict.book.saleBadge}</span>
          <span className={cn('mt-0.5 leading-none font-bold tabular-nums', large ? 'text-2xl' : 'text-lg')} dir="ltr">
            −{percentOff}%
          </span>
        </span>
      ) : null}
    </>
  )
}
