import { readAppEnvironment } from '@/lib/appEnvironment'

import type { Dictionary } from '@/app/(frontend)/dictionary'

/** Shown on every screen of the mock payment flow: nobody should mistake a
 * demo for a real purchase, in either direction. A demo deployment already
 * carries DemoBanner on every page, so this stays quiet there rather than
 * repeat it. */
export function MockPaymentNotice({ dict }: { dict: Dictionary }) {
  if (readAppEnvironment() === 'demo') return null

  return (
    <p role="note" className="border-b-[3px] border-gold bg-paper-deep px-4 py-3 text-center text-sm font-medium text-teal-deep">
      {dict.mockPayment.banner}
    </p>
  )
}
