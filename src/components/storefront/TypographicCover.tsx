import { CoverFrame } from '@/components/storefront/CoverFrame'
import { coverTitleWidthPercent } from '@/lib/cover'

import type { CoverIdentity } from '@/lib/cover'

// The imprint printed at the foot of every cover, whatever the book's
// language — a publisher's mark, not interface text to translate.
const INSTITUTE_MARK = 'מכון רמח״ל'

/**
 * A rendered cover, not an image file — 121 of 128 books have no scanned
 * cover, so this is the catalogue's visual identity, not a fallback
 * (docs/tasks/TASK-06-storefront.md §5). Modelled on a sefer's title page:
 * the title, centred in the upper part of a double-ruled frame, a short rule
 * and the imprint below.
 */
export function TypographicCover({ book, title }: { book: CoverIdentity; title: string }) {
  return (
    <CoverFrame book={book}>
      {/* Bottom padding lifts the title just above true centre, where the eye expects it. */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-[7cqw] pb-[6cqw]">
        <p
          className="line-clamp-4 text-center font-sans font-semibold leading-[1.25] break-words text-teal-deep [text-wrap:balance]"
          style={{ fontSize: `${coverTitleWidthPercent(title)}cqw` }}
        >
          {title}
        </p>
      </div>
      <div className="flex flex-col items-center gap-[3cqw] pb-[7cqw] @max-[7rem]:hidden">
        <span className="h-px w-[14cqw] bg-gold" aria-hidden />
        <span className="font-sans text-[5.5cqw] leading-none text-gold-ink">{INSTITUTE_MARK}</span>
      </div>
    </CoverFrame>
  )
}
