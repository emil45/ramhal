'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'

import { submitCheckout } from '@/app/(frontend)/checkoutActions'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import { orderShippingCost } from '@/lib/orderPricing'
import { formatPrice } from '@/lib/price'
import { localePath } from '@/lib/routes'
import { calculateShipping } from '@/lib/shipping'

import type { Currency } from '@/lib/currency'
import type { CheckoutActionState } from '@/app/(frontend)/checkoutActions'
import type { CheckoutFormField } from '@/lib/checkoutForm'
import type { ComponentProps } from 'react'
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
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start lg:gap-14">
      <div className="flex flex-col gap-10">
        <FieldSet className="gap-5">
          <FieldLegend className="type-heading! mb-2">{dict.checkout.contactHeading}</FieldLegend>
          <TextField label={dict.checkout.name} error={fieldError('name')} name="name" defaultValue={submitted.name} type="text" autoComplete="name" required />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label={dict.checkout.email} error={fieldError('email')} name="email" defaultValue={submitted.email} type="email" dir="ltr" autoComplete="email" required />
            <TextField label={dict.checkout.phone} error={fieldError('phone')} name="phone" defaultValue={submitted.phone} type="tel" dir="ltr" autoComplete="tel" required />
          </div>
        </FieldSet>

        <FieldSet className="gap-5">
          <FieldLegend className="type-heading! mb-2">{dict.checkout.deliveryHeading}</FieldLegend>
          <Field data-invalid={!!fieldError('countryCode')}>
            <FieldLabel htmlFor="checkout-country">{dict.checkout.country}</FieldLabel>
            <NativeSelect
              id="checkout-country"
              name="countryCode"
              value={countryCode}
              onChange={(event) => setCountryCode(event.currentTarget.value)}
              autoComplete="country"
              className="w-full"
            >
              {countries.map((country) => (
                <NativeSelectOption key={country.code} value={country.code}>
                  {country.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldDescription>{dict.checkout.destinationsNote}</FieldDescription>
            <FieldError>{fieldError('countryCode')}</FieldError>
          </Field>

          {pickupAllowed && (
            <Field orientation="horizontal" className="items-start rounded-md border border-border bg-paper-deep p-4">
              <Checkbox id="checkout-pickup" name="pickup" checked={isPickup} onCheckedChange={setIsPickup} className="mt-0.5 size-5 bg-card" />
              <div className="flex flex-col gap-0.5">
                <FieldLabel htmlFor="checkout-pickup">{dict.checkout.pickup}</FieldLabel>
                <FieldDescription>{dict.checkout.pickupNote}</FieldDescription>
              </div>
            </Field>
          )}

          {!pickupChosen && (
            <>
              <TextField label={dict.checkout.addressLine1} error={fieldError('addressLine1')} name="addressLine1" defaultValue={submitted.addressLine1} type="text" autoComplete="address-line1" required />
              <TextField label={dict.checkout.addressLine2} name="addressLine2" defaultValue={submitted.addressLine2} type="text" autoComplete="address-line2" />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label={dict.checkout.city} error={fieldError('city')} name="city" defaultValue={submitted.city} type="text" autoComplete="address-level2" required />
                <TextField label={dict.checkout.postalCode} error={fieldError('postalCode')} name="postalCode" defaultValue={submitted.postalCode} type="text" dir="ltr" autoComplete="postal-code" required />
              </div>
            </>
          )}
        </FieldSet>
      </div>

      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle className="type-subheading!">{dict.checkout.summaryHeading}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2 text-sm">
            {lines.map((line) => (
              <li key={line.bookId} className="flex justify-between gap-3">
                <span>
                  {line.title} <span className="text-muted-foreground">× {line.quantity}</span>
                </span>
                <span className="shrink-0 tabular-nums">{money(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <Separator />
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{dict.checkout.subtotal}</dt>
              <dd className="tabular-nums">{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{dict.checkout.shipping}</dt>
              <dd className="tabular-nums">{shippingCost === 0 ? dict.checkout.shippingFree : money(shippingCost)}</dd>
            </div>
          </dl>
          <Separator />
          <div className="flex items-baseline justify-between font-semibold">
            <span>{dict.checkout.total}</span>
            <span className="text-xl tabular-nums text-teal-deep">{money(total)}</span>
          </div>

          <Input type="hidden" name="expectedTotal" value={total} />

          {state?.problem && (
            <p role="alert" className="rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {problemMessage(state.problem, dict)}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? dict.checkout.submitting : dict.checkout.submit}
          </Button>
          <Link href={localePath(locale, '/cart')} className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
            {dict.checkout.backToCart}
          </Link>
        </CardFooter>
      </Card>
    </form>
  )
}

type TextFieldProps = Omit<ComponentProps<typeof Input>, 'id'> & { error?: string | null; label: string; name: string }

/** One labelled text input with its own error line. The id is the field's
 * name, which is unique within the form, so the label is always wired to it. */
function TextField({ error, label, name, ...inputProps }: TextFieldProps) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={`checkout-${name}`}>{label}</FieldLabel>
      <Input id={`checkout-${name}`} name={name} aria-invalid={!!error} {...inputProps} />
      <FieldError>{error}</FieldError>
    </Field>
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
