'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { removeFromCart, updateCartQuantity } from '@/app/(frontend)/cartActions'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { announceCartChange } from '@/lib/cartEvents'

import type { Locale } from '@/lib/locale'

export function CartLineControls({ bookId, locale, quantity }: { bookId: number; locale: Locale; quantity: number }) {
  // See CatalogueClient's comment: dict holds functions, which can't cross
  // the server→client prop boundary, so it's computed here instead of
  // passed down.
  const dict = getDictionary(locale)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-end gap-3">
      <Field orientation="horizontal" className="w-auto items-center">
        <FieldLabel htmlFor={`cart-quantity-${bookId}`}>{dict.cart.quantity}</FieldLabel>
        <Input
          id={`cart-quantity-${bookId}`}
          type="number"
          min={1}
          defaultValue={quantity}
          disabled={isPending}
          className="w-20"
          onBlur={(event) => {
            const next = Math.max(1, Number(event.currentTarget.value) || 1)
            startTransition(async () => {
              await updateCartQuantity(bookId, next)
              announceCartChange()
              router.refresh()
            })
          }}
        />
      </Field>
      <Button
        variant="ghost"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await removeFromCart(bookId)
            announceCartChange()
            router.refresh()
          })
        }}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 aria-hidden />
        {dict.cart.remove}
      </Button>
    </div>
  )
}
