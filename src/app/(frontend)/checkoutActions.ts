'use server'

import { redirect } from 'next/navigation'

import { parseCheckoutForm } from '@/lib/checkoutForm'
import { isLocale } from '@/lib/locale'
import { placeOrder } from '@/lib/placeOrder'
import { getCartItems } from '@/lib/serverCart'

import type { CheckoutFormErrors } from '@/lib/checkoutForm'
import type { PlaceOrderProblem } from '@/lib/placeOrder'

export type CheckoutActionState = {
  fieldErrors?: CheckoutFormErrors
  problem?: PlaceOrderProblem
  /** What the customer typed, handed back because React clears an
   * uncontrolled form once its action finishes — a rejected submission must
   * not wipe out their address. */
  submitted: Record<string, string>
} | null

/**
 * Submitting the checkout form. Success never returns: the customer is sent
 * on to the payment provider's page. The cart is deliberately left alone
 * here — it is cleared only once the order is actually paid (see the return
 * route), so a declined or abandoned payment costs the customer nothing.
 */
export async function submitCheckout(
  locale: string,
  _previous: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  if (!isLocale(locale)) throw new Error(`Unknown locale "${locale}".`)

  const submitted = Object.fromEntries([...formData.entries()].filter((entry): entry is [string, string] => typeof entry[1] === 'string'))

  const parsed = parseCheckoutForm(formData)
  if (!parsed.ok) return { fieldErrors: parsed.errors, submitted }

  const result = await placeOrder({ cart: await getCartItems(), form: parsed.values, locale })
  if (!result.ok) return { problem: result.problem, submitted }

  redirect(result.redirectUrl)
}
