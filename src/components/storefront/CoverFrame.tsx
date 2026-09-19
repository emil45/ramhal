import { AspectRatio } from '@/components/ui/aspect-ratio'
import { COVER_ASPECT_RATIO, coverRuleColour } from '@/lib/cover'

import type { CSSProperties, ReactNode } from 'react'

/**
 * The paper, the double rule and the shadow that every cover shares — a real
 * photograph and a typeset title sit in the same frame, so a shelf of both
 * reads as one system. Everything inside is sized in `cqw` (a percentage of
 * this box's own width), so the frame scales from a cart thumbnail to the
 * book page without a breakpoint.
 */
export function CoverFrame({ categorySlug, children }: { categorySlug: string | null | undefined; children: ReactNode }) {
  const style: CSSProperties & { '--cover-rule': string } = { '--cover-rule': coverRuleColour(categorySlug) }

  return (
    <AspectRatio
      ratio={COVER_ASPECT_RATIO}
      className="@container relative overflow-hidden rounded-[2px] bg-paper-deep shadow-[0_1px_2px_rgb(0_0_0/0.16),0_0_0_1px_rgb(0_0_0/0.05)] transition-[transform,box-shadow] duration-200 ease-out group-hover/cover:-translate-y-1 group-hover/cover:shadow-[0_6px_14px_-4px_rgb(0_0_0/0.28),0_0_0_1px_rgb(0_0_0/0.06)] motion-reduce:transition-none motion-reduce:group-hover/cover:translate-y-0"
      style={style}
    >
      {/* Outer rule, then a thinner one inside it, as on a sefer's title page. */}
      <div className="absolute inset-[5cqw] border-[max(1.5px,1cqw)] border-(--cover-rule) p-[1.6cqw]">
        <div className="relative flex h-full flex-col border-[max(1px,0.4cqw)] border-(--cover-rule)">{children}</div>
      </div>
    </AspectRatio>
  )
}
