import type { Dictionary } from '@/app/(frontend)/dictionary'

/** Shown on every screen of the mock payment flow: nobody should mistake a
 * demo for a real purchase, in either direction. */
export function MockPaymentNotice({ dict }: { dict: Dictionary }) {
  return (
    <p role="note" className="border-b-[3px] border-gold bg-paper-deep px-4 py-3 text-center text-sm font-medium text-teal-deep">
      {dict.mockPayment.banner}
    </p>
  )
}
