import type { Dictionary } from '@/app/(frontend)/dictionary'

/** Shown on every screen of the mock payment flow: nobody should mistake a
 * demo for a real purchase, in either direction. */
export function MockPaymentNotice({ dict }: { dict: Dictionary }) {
  return (
    <p role="note" className="border-b-2 border-amber-500 bg-amber-100 px-4 py-3 text-center text-sm font-semibold text-amber-950">
      {dict.mockPayment.banner}
    </p>
  )
}
