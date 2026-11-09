import { toIsraeliMobileNumber } from '@/lib/payment/israeliMobileNumber'

import type { PaymentRequest } from '@/lib/payment/paymentProvider'

export type GrowPayer = { fullName: string; phone: string; email: string }

const MIN_NAME_LENGTH = 2
const MIN_NAME_PARTS = 2

/**
 * The payer as Grow's payment page accepts them, or null when it would refuse
 * them: it wants a first and a last name of at least two characters each and
 * an Israeli mobile number. Checkout accepts any phone shape and a single
 * name, so this is where the two sets of rules meet.
 */
export function toGrowPayer(payer: PaymentRequest['payer']): GrowPayer | null {
  const phone = toIsraeliMobileNumber(payer.phone)
  const nameParts = payer.name.trim().split(/\s+/)
  const hasFullName = nameParts.length >= MIN_NAME_PARTS && nameParts.every((part) => part.length >= MIN_NAME_LENGTH)
  if (!phone || !hasFullName) return null

  return { fullName: nameParts.join(' '), phone, email: payer.email }
}
