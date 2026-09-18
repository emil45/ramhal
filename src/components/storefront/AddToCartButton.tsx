'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { addToCart } from '@/app/(frontend)/cartActions'
import { Button } from '@/components/ui/button'
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
  // one action, not N clicks — docs/tasks/TASK-07-storefront.md §A3.
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-1.5 text-sm">
        {dict.cart.quantity}
        <input
          type="number"
          min={1}
          value={quantity}
          disabled={isPending}
          onChange={(event) => setQuantity(Math.max(1, Number(event.currentTarget.value) || 1))}
          className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm"
        />
      </label>
      <Button
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await addToCart(bookId, locale, quantity)
            if (result.ok) {
              setAdded(true)
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
