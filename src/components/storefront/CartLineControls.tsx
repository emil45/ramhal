'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { removeFromCart, updateCartQuantity } from '@/app/(frontend)/cartActions'
import { getDictionary } from '@/app/(frontend)/dictionary'

import type { Locale } from '@/lib/locale'

export function CartLineControls({ bookId, locale, quantity }: { bookId: number; locale: Locale; quantity: number }) {
  // See CatalogueClient's comment: dict holds functions, which can't cross
  // the server→client prop boundary, so it's computed here instead of
  // passed down.
  const dict = getDictionary(locale)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-1.5 text-sm">
        {dict.cart.quantity}
        <input
          type="number"
          min={1}
          defaultValue={quantity}
          disabled={isPending}
          onBlur={(event) => {
            const next = Math.max(1, Number(event.currentTarget.value) || 1)
            startTransition(async () => {
              await updateCartQuantity(bookId, next)
              router.refresh()
            })
          }}
          className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
        />
      </label>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await removeFromCart(bookId)
            router.refresh()
          })
        }}
        className="text-sm text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
      >
        {dict.cart.remove}
      </button>
    </div>
  )
}
