'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { addToCart } from '@/app/(frontend)/cartActions'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { announceCartChange } from '@/lib/cartEvents'
import { getDictionary } from '@/app/(frontend)/dictionary'

import type { Locale } from '@/lib/locale'

export function AddToCartButton({ bookId, locale }: { bookId: number; locale: Locale }) {
  // See CatalogueClient's comment: dict holds functions, which can't cross
  // the server→client prop boundary, so it's computed here instead of
  // passed down.
  const dict = getDictionary(locale)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)
  // Shipping tiers count items, so buying several copies at once should be
  // one action, not N clicks.
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="flex items-end gap-3">
      <Field className="w-24">
        <FieldLabel htmlFor={`quantity-${bookId}`}>{dict.cart.quantity}</FieldLabel>
        <Input
          id={`quantity-${bookId}`}
          type="number"
          min={1}
          value={quantity}
          disabled={isPending}
          onChange={(event) => setQuantity(Math.max(1, Number(event.currentTarget.value) || 1))}
        />
      </Field>
      <Button
        size="lg"
        className="min-w-44"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await addToCart(bookId, locale, quantity)
            if (result.ok) {
              setAdded(true)
              announceCartChange()
              router.refresh()
              setTimeout(() => setAdded(false), 2000)
            }
          })
        }}
      >
        {isPending ? dict.book.adding : added ? dict.book.added : dict.book.addToCart}
      </Button>
    </div>
  )
}
