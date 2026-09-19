'use client'

import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getCartItemCount } from '@/app/(frontend)/cartActions'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { CART_CHANGED_EVENT } from '@/lib/cartEvents'
import { cn } from '@/lib/utils'

import type { Locale } from '@/lib/locale'

/**
 * The count is fetched in the browser rather than read while rendering the
 * header: the cart is per visitor (a cookie), and reading it in the layout
 * would make every page in the shop uncacheable.
 */
export function CartLink({ href, locale }: { href: string; locale: Locale }) {
  // See CatalogueClient's comment: dict holds functions, which can't cross
  // the server→client prop boundary, so it's computed here instead of
  // passed down.
  const dict = getDictionary(locale)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const refresh = () => {
      getCartItemCount().then(setCount)
    }
    refresh()
    window.addEventListener(CART_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(CART_CHANGED_EVENT, refresh)
  }, [])

  return (
    <Link
      href={href}
      aria-label={dict.nav.cartLabel(count)}
      className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative')}
    >
      <ShoppingBag className="size-5" aria-hidden />
      {count > 0 ? (
        <Badge className="absolute -top-1 -end-1 h-5 min-w-5 rounded-full bg-gold px-1 font-bold text-foreground">{count}</Badge>
      ) : null}
    </Link>
  )
}
