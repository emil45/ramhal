import type { Dictionary } from '@/app/(frontend)/dictionary'

/**
 * The labels pinned to a book's corner, as a bookseller tapes a slip to the
 * jacket: "sale" first, because it changes what the visitor pays. Square
 * printed slips in the brand inks, never a coloured sticker.
 */
export function BookBadges({ dict, isNew, percentOff }: { dict: Dictionary; isNew: boolean; percentOff: number | null }) {
  if (!isNew && percentOff === null) return null

  return (
    <div className="pointer-events-none absolute start-0 top-3 z-10 flex flex-col items-start gap-1.5">
      {percentOff !== null ? (
        <span className="bg-gold-ink px-2.5 py-1 text-xs leading-none font-semibold text-paper">
          {dict.book.saleBadge}{' '}
          <span className="tabular-nums" dir="ltr">
            −{percentOff}%
          </span>
        </span>
      ) : null}
      {isNew ? <span className="bg-teal-deep px-2.5 py-1 text-xs leading-none font-semibold text-paper">{dict.book.newBadge}</span> : null}
    </div>
  )
}
