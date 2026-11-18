import { CoverFrame } from '@/components/storefront/CoverFrame'
import { coverRuleColour, coverTitleWidthPercent } from '@/lib/books/cover'

import type { CoverIdentity } from '@/lib/books/cover'
import type { CSSProperties } from 'react'

// The imprint printed at the foot of every cover, whatever the book's
// language — a publisher's mark, not interface text to translate.
const INSTITUTE_MARK = 'מכון רמח״ל'

/**
 * A rendered cover, not an image file, for the books with no photograph.
 * It is drawn as a book standing on the shelf, the way the photographs show
 * theirs: a lighter board with a soft shadow, and on it a sefer's title page
 * — a double rule in the shelf's colour, the title, a short rule and the
 * imprint.
 */
export function TypographicCover({ book, title }: { book: CoverIdentity; title: string }) {
  const style: CSSProperties & { '--cover-rule': string } = { '--cover-rule': coverRuleColour(book) }

  return (
    <CoverFrame>
      <div
        style={style}
        className="absolute inset-x-[11cqw] inset-y-[9cqw] flex flex-col bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.12),0_8px_18px_-8px_rgb(0_0_0/0.3)] transition-transform duration-300 ease-out group-hover/cover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/cover:scale-100"
      >
        <div className="m-[4cqw] flex flex-1 flex-col border-[max(1.5px,0.9cqw)] border-(--cover-rule) p-[1.4cqw]">
          <div className="flex flex-1 flex-col border-[max(1px,0.35cqw)] border-(--cover-rule)">
            {/* Bottom padding lifts the title just above true centre, where the eye expects it. */}
            <div className="flex min-h-0 flex-1 items-center justify-center px-[5cqw] pb-[4cqw]">
              <p
                className="line-clamp-4 text-center font-serif font-medium leading-[1.2] break-words text-teal-deep [text-wrap:balance]"
                style={{ fontSize: `${coverTitleWidthPercent(title)}cqw` }}
              >
                {title}
              </p>
            </div>
            <div className="flex flex-col items-center gap-[2.5cqw] pb-[6cqw] @max-[7rem]:hidden">
              <span className="h-px w-[12cqw] bg-gold" aria-hidden />
              <span className="font-sans text-[4.5cqw] leading-none text-gold-ink">{INSTITUTE_MARK}</span>
            </div>
          </div>
        </div>
      </div>
    </CoverFrame>
  )
}
