import { hasAtMostTwoDecimalPlaces } from '@/lib/validateMoneyAmount'

export type CheckoutFormValues = {
  name: string
  email: string
  phone: string
  countryCode: string
  isPickup: boolean
  address: { line1: string; line2: string; city: string; postalCode: string }
  /** The total the customer was looking at when they submitted, in major
   * units (shekels/dollars/euros). Never used to price the order — only
   * compared against the server's own total, so a price that changed between
   * page load and submit is caught rather than silently charged. */
  expectedTotal: number
}

export type CheckoutFormField =
  | 'name'
  | 'email'
  | 'phone'
  | 'countryCode'
  | 'addressLine1'
  | 'city'
  | 'postalCode'
  | 'expectedTotal'

export type CheckoutFormErrors = Partial<Record<CheckoutFormField, 'required' | 'invalid'>>

export type CheckoutFormResult = { ok: true; values: CheckoutFormValues } | { ok: false; errors: CheckoutFormErrors }

type FormSource = { get(name: string): unknown }

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// E.164 caps a phone number at 15 digits; 7 is the shortest real local number.
const PHONE_DIGITS_MIN = 7
const PHONE_DIGITS_MAX = 15

function readText(source: FormSource, name: string): string {
  const value = source.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

function isPhoneShaped(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return /^[+\d\s\-().]+$/.test(phone) && digits.length >= PHONE_DIGITS_MIN && digits.length <= PHONE_DIGITS_MAX
}

/**
 * Turns submitted form fields into checkout values, or says which fields are
 * wrong. Errors are codes, not sentences — the form shows them in the
 * viewer's language. A self-pickup order needs no postal address.
 */
export function parseCheckoutForm(source: FormSource): CheckoutFormResult {
  const errors: CheckoutFormErrors = {}

  const name = readText(source, 'name')
  if (!name) errors.name = 'required'

  const email = readText(source, 'email')
  if (!email) errors.email = 'required'
  else if (!EMAIL_SHAPE.test(email)) errors.email = 'invalid'

  const phone = readText(source, 'phone')
  if (!phone) errors.phone = 'required'
  else if (!isPhoneShaped(phone)) errors.phone = 'invalid'

  const countryCode = readText(source, 'countryCode')
  if (!countryCode) errors.countryCode = 'required'

  const isPickup = readText(source, 'pickup') === 'on'
  const address = {
    line1: readText(source, 'addressLine1'),
    line2: readText(source, 'addressLine2'),
    city: readText(source, 'city'),
    postalCode: readText(source, 'postalCode'),
  }
  if (!isPickup) {
    if (!address.line1) errors.addressLine1 = 'required'
    if (!address.city) errors.city = 'required'
    if (!address.postalCode) errors.postalCode = 'required'
  }

  const expectedTotalText = readText(source, 'expectedTotal')
  const expectedTotal = Number(expectedTotalText)
  if (!expectedTotalText || !Number.isFinite(expectedTotal) || expectedTotal < 0 || hasAtMostTwoDecimalPlaces(expectedTotal) !== true) {
    errors.expectedTotal = 'invalid'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return { ok: true, values: { name, email, phone, countryCode, isPickup, address, expectedTotal } }
}
