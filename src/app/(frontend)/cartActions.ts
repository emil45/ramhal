'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

import { isPurchasable } from '@/lib/availability'
import { isLocale, LOCALE_CONFIG } from '@/lib/locale'
import { getOrCreateCart } from '@/lib/serverCart'

type ActionResult = { error?: 'invalid-locale' | 'not-found' | 'not-purchasable'; ok: boolean }

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
 */
export async function addToCart(bookId: number, locale: string): Promise<ActionResult> {
  if (!isLocale(locale)) return { ok: false, error: 'invalid-locale' }

  const payload = await getPayload({ config })
  const book = await payload.findByID({ collection: 'books', id: bookId }).catch(() => null)
  if (!book) return { ok: false, error: 'not-found' }
  if (!isPurchasable(book, LOCALE_CONFIG[locale].currency)) return { ok: false, error: 'not-purchasable' }

  const cart = await getOrCreateCart()
  const items = toItemInput(cart.items ?? [])
  const existing = items.find((item) => item.book === bookId)
  if (existing) existing.quantity += 1
  else items.push({ book: bookId, quantity: 1 })

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
