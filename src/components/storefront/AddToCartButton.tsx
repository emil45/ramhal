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

  return (
    <Button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await addToCart(bookId, locale)
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
  )
}
