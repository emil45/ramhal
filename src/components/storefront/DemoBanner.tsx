import { readAppEnvironment } from '@/lib/appEnvironment'

import type { Dictionary } from '@/app/(frontend)/dictionary'

/**
 * Says, on every page of a demonstration deployment, that no real payment is
 * taken. Sticky and without a close control on purpose: a visitor must not
 * be able to lose it by scrolling, and nobody may dismiss it for them.
 * Renders nothing outside APP_ENV=demo.
 */
export function DemoBanner({ dict }: { dict: Dictionary }) {
  if (readAppEnvironment() !== 'demo') return null

  return (
    <div role="note" className="sticky top-0 z-50 border-b-[3px] border-gold bg-teal-deep text-paper">
      <p className="page-container flex flex-wrap items-baseline justify-center gap-x-3 gap-y-0.5 py-2 text-center text-sm font-medium sm:text-base">
        <span className="rounded-[2px] bg-gold px-2 py-px text-xs font-bold tracking-wide text-foreground">{dict.demo.label}</span>
        <span>{dict.demo.banner}</span>
      </p>
    </div>
  )
}
