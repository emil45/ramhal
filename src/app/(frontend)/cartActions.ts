'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

import { isPurchasable } from '@/lib/availability'
import { isLocale, LOCALE_CONFIG } from '@/lib/locale'
import { getCartItemCount as readCartItemCount, getOrCreateCart } from '@/lib/serverCart'

type ActionResult = { error?: 'invalid-locale' | 'invalid-quantity' | 'not-found' | 'not-purchasable'; ok: boolean }

function toItemInput(items: { book: number | { id: number }; quantity: number }[]) {
  return items.map((item) => ({
    book: typeof item.book === 'object' ? item.book.id : item.book,
    quantity: item.quantity,
  }))
}

/**
 * Re-checks purchasability server-side rather than trusting the client —
 * the button that calls this is only ever rendered for a purchasable book,
 * but this is the actual gate (docs/tasks/TASK-06-storefront.md §3b): a
 * book with no price in the viewer's currency, or a real 0.00 (see
 * docs/reviews/REVIEW-01-findings.md), can never be added.
 *
 * `quantity` is the number of copies the product page's own selector was
 * set to (docs/tasks/TASK-07-storefront.md §A3 — shipping tiers count
 * items, so buying three copies used to mean three separate clicks). Added
 * to whatever quantity is already in the cart for this book, same as
 * clicking "add to cart" once used to increment by exactly one.
 */
export async function addToCart(bookId: number, locale: string, quantity: number = 1): Promise<ActionResult> {
  if (!isLocale(locale)) return { ok: false, error: 'invalid-locale' }
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: 'invalid-quantity' }

  const payload = await getPayload({ config })
  const book = await payload.findByID({ collection: 'books', id: bookId }).catch(() => null)
  if (!book) return { ok: false, error: 'not-found' }
  if (!isPurchasable(book, LOCALE_CONFIG[locale].currency)) return { ok: false, error: 'not-purchasable' }

  const cart = await getOrCreateCart()
  const items = toItemInput(cart.items ?? [])
  const existing = items.find((item) => item.book === bookId)
  if (existing) existing.quantity += quantity
  else items.push({ book: bookId, quantity })

  await payload.update({ collection: 'carts', id: cart.id, data: { items } })
  return { ok: true }
}

export async function updateCartQuantity(bookId: number, quantity: number): Promise<ActionResult> {
  const payload = await getPayload({ config })
  const cart = await getOrCreateCart()
  const items = toItemInput(cart.items ?? []).filter((item) => (item.book === bookId ? quantity > 0 : true))
  const target = items.find((item) => item.book === bookId)
  if (target) target.quantity = quantity

  await payload.update({ collection: 'carts', id: cart.id, data: { items } })
  return { ok: true }
}

export async function removeFromCart(bookId: number): Promise<ActionResult> {
  const payload = await getPayload({ config })
  const cart = await getOrCreateCart()
  const items = toItemInput(cart.items ?? []).filter((item) => item.book !== bookId)

  await payload.update({ collection: 'carts', id: cart.id, data: { items } })
  return { ok: true }
}

export async function getCartItemCount(): Promise<number> {
  return readCartItemCount()
}
