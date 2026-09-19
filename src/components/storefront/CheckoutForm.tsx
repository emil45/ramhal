'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'

import { submitCheckout } from '@/app/(frontend)/checkoutActions'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { orderShippingCost } from '@/lib/orderPricing'
import { formatPrice } from '@/lib/price'
import { localePath } from '@/lib/routes'
import { calculateShipping } from '@/lib/shipping'

import type { Currency } from '@/lib/currency'
import type { CheckoutActionState } from '@/app/(frontend)/checkoutActions'
import type { CheckoutFormField } from '@/lib/checkoutForm'
import type { Locale } from '@/lib/locale'
import type { PlaceOrderProblem } from '@/lib/placeOrder'
import type { ShippingZone } from '@/lib/shipping'

type CheckoutFormProps = {
  countries: { code: string; name: string }[]
  currency: Currency
  defaultCountry: string | undefined
  lines: { bookId: number; title: string; quantity: number; unitPrice: number }[]
  locale: Locale
  subtotal: number
  units: number
  zones: ShippingZone[]
}

const inputClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm aria-[invalid=true]:border-destructive'

export function CheckoutForm({ countries, currency, defaultCountry, lines, locale, subtotal, units, zones }: CheckoutFormProps) {
  // See CatalogueClient's comment: dict holds functions, which can't cross
  // the server→client prop boundary, so it's computed here instead of
  // passed down.
  const dict = getDictionary(locale)
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<CheckoutActionState, FormData>(submitCheckout.bind(null, locale), null)

  const [countryCode, setCountryCode] = useState(defaultCountry ?? '')
  const [isPickup, setIsPickup] = useState(false)

  const quote = calculateShipping(zones, { countryCode, units })
  const pickupAllowed = quote.allowPickup
  const pickupChosen = isPickup && pickupAllowed
  const shippingCost = orderShippingCost(quote, pickupChosen)
  const total = subtotal + shippingCost

  // The server re-prices everything; if it found a different total than the
  // one this page showed (a price changed under the customer), re-fetch the
  // page so the customer sees the number they are about to be charged.
  useEffect(() => {
    if (state?.problem?.kind === 'total-changed') router.refresh()
  }, [state, router])

  const submitted = state?.submitted ?? {}

  const fieldError = (field: CheckoutFormField) => {
    const code = state?.fieldErrors?.[field]
    return code ? dict.checkout.errors[code] : null
  }

  const money = (amount: number) => formatPrice(amount, currency, locale)

  return (
    <form action={formAction} className="grid gap-8 md:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 font-serif text-lg font-semibold text-teal-deep">{dict.checkout.contactHeading}</legend>
          <Field label={dict.checkout.name} error={fieldError('name')}>
            <input name="name" defaultValue={submitted.name} type="text" autoComplete="name" required className={inputClass} aria-invalid={!!fieldError('name')} />
          </Field>
          <Field label={dict.checkout.email} error={fieldError('email')}>
            <input name="email" defaultValue={submitted.email} type="email" dir="ltr" autoComplete="email" required className={inputClass} aria-invalid={!!fieldError('email')} />
          </Field>
          <Field label={dict.checkout.phone} error={fieldError('phone')}>
            <input name="phone" defaultValue={submitted.phone} type="tel" dir="ltr" autoComplete="tel" required className={inputClass} aria-invalid={!!fieldError('phone')} />
          </Field>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 font-serif text-lg font-semibold text-teal-deep">{dict.checkout.deliveryHeading}</legend>
          <Field label={dict.checkout.country} error={fieldError('countryCode')}>
            <select
              name="countryCode"
              value={countryCode}
              onChange={(event) => setCountryCode(event.currentTarget.value)}
              autoComplete="country"
              className={inputClass}
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </Field>
          <p className="-mt-2 text-xs text-muted-foreground">{dict.checkout.destinationsNote}</p>

          {pickupAllowed && (
            <label className="flex items-start gap-2 rounded-md bg-secondary px-3 py-2 text-sm">
              <input
                name="pickup"
                type="checkbox"
                checked={isPickup}
                onChange={(event) => setIsPickup(event.currentTarget.checked)}
                className="mt-0.5"
              />
              <span>
                {dict.checkout.pickup}
                <span className="block text-xs text-muted-foreground">{dict.checkout.pickupNote}</span>
              </span>
            </label>
          )}

          {!pickupChosen && (
            <>
              <Field label={dict.checkout.addressLine1} error={fieldError('addressLine1')}>
                <input name="addressLine1" defaultValue={submitted.addressLine1} type="text" autoComplete="address-line1" required className={inputClass} aria-invalid={!!fieldError('addressLine1')} />
              </Field>
              <Field label={dict.checkout.addressLine2}>
                <input name="addressLine2" defaultValue={submitted.addressLine2} type="text" autoComplete="address-line2" className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={dict.checkout.city} error={fieldError('city')}>
                  <input name="city" defaultValue={submitted.city} type="text" autoComplete="address-level2" required className={inputClass} aria-invalid={!!fieldError('city')} />
                </Field>
                <Field label={dict.checkout.postalCode} error={fieldError('postalCode')}>
                  <input name="postalCode" defaultValue={submitted.postalCode} type="text" dir="ltr" autoComplete="postal-code" required className={inputClass} aria-invalid={!!fieldError('postalCode')} />
                </Field>
              </div>
            </>
          )}
        </fieldset>
      </div>

      <aside className="flex flex-col gap-3 self-start rounded-md border border-border bg-card p-4">
        <h2 className="font-serif text-lg font-semibold text-teal-deep">{dict.checkout.summaryHeading}</h2>
        <ul className="flex flex-col gap-1.5 text-sm">
          {lines.map((line) => (
            <li key={line.bookId} className="flex justify-between gap-3">
              <span>
                {line.title} <span className="text-muted-foreground">× {line.quantity}</span>
              </span>
              <span className="shrink-0">{money(line.unitPrice * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{dict.checkout.subtotal}</dt>
            <dd>{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{dict.checkout.shipping}</dt>
            <dd>{shippingCost === 0 ? dict.checkout.shippingFree : money(shippingCost)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>{dict.checkout.total}</dt>
            <dd>{money(total)}</dd>
          </div>
        </dl>

        <input type="hidden" name="expectedTotal" value={total} />

        {state?.problem && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {problemMessage(state.problem, dict)}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-deep disabled:opacity-60"
        >
          {isPending ? dict.checkout.submitting : dict.checkout.submit}
        </button>
        <Link href={localePath(locale, '/cart')} className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
          {dict.checkout.backToCart}
        </Link>
      </aside>
    </form>
  )
}

function Field({ children, error, label }: { children: React.ReactNode; error?: string | null; label: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  )
}

function problemMessage(problem: PlaceOrderProblem, dict: ReturnType<typeof getDictionary>): string {
  const { problems } = dict.checkout
  switch (problem.kind) {
    case 'empty-cart':
      return problems.emptyCart
    case 'book-not-purchasable':
      return problems.bookNotPurchasable(problem.bookTitle)
    case 'book-out-of-stock':
      return problems.bookOutOfStock(problem.bookTitle)
    case 'destination-not-served':
      return problems.destinationNotServed
    case 'pickup-not-available':
      return problems.pickupNotAvailable
    case 'total-changed':
      return problems.totalChanged
  }
}
