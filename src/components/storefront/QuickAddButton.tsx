'use client'

import { Check, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { addToCart } from '@/app/(frontend)/cartActions'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { Button } from '@/components/ui/button'
import { announceCartChange } from '@/lib/shop/cartEvents'

import type { Locale } from '@/lib/locale/locale'

const ADDED_CONFIRMATION_MILLISECONDS = 2000

/** One copy into the cart straight from a catalogue card; the book page is where a visitor sets a quantity. */
export function QuickAddButton({ bookId, locale }: { bookId: number; locale: Locale }) {
  // See CatalogueClient's comment: dict holds functions, which cannot cross
  // the server→client prop boundary, so it is computed here.
  const dict = getDictionary(locale)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)

  return (
    <Button
      variant="outline"
      className="relative z-10 w-full border-teal/40 text-teal-deep hover:border-teal hover:bg-teal hover:text-primary-foreground"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await addToCart(bookId, locale)
          if (result.ok) {
            setAdded(true)
            announceCartChange()
            router.refresh()
            setTimeout(() => setAdded(false), ADDED_CONFIRMATION_MILLISECONDS)
          }
        })
      }}
    >
      {added ? <Check aria-hidden /> : <ShoppingBag aria-hidden />}
      {isPending ? dict.book.adding : added ? dict.book.added : dict.book.addToCart}
    </Button>
  )
}
