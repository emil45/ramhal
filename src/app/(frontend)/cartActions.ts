'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

import { isPurchasable } from '@/lib/availability'
import { chooseColor, isSameCartLine } from '@/lib/bookColors'
import { isLocale, LOCALE_CONFIG } from '@/lib/locale'
import { getCartItemCount as readCartItemCount, getOrCreateCart } from '@/lib/serverCart'

type ActionResult = { error?: 'invalid-color' | 'invalid-locale' | 'invalid-quantity' | 'not-found' | 'not-purchasable'; ok: boolean }

type CartLineKey = { bookId: number; colorId: string | null }

function toItemInput(items: { book: number | { id: number }; colorId?: string | null; quantity: number }[]) {
  return items.map((item) => ({
    book: typeof item.book === 'object' ? item.book.id : item.book,
    colorId: item.colorId ?? null,
    quantity: item.quantity,
  }))
}

function isLine(item: { book: number; colorId: string | null }, key: CartLineKey): boolean {
  return isSameCartLine({ bookId: item.book, colorId: item.colorId }, key)
}

/**
 * Re-checks purchasability server-side rather than trusting the client —
 * the button that calls this is only ever rendered for a purchasable book,
 * but this is the actual gate: a book with no price in the viewer's
 * currency, or a real 0.00, can never be added.
 *
 * `quantity` is the number of copies the product page's own selector was
 * set to — shipping tiers count items, so buying three copies used to mean
 * three separate clicks. Added
 * to whatever quantity is already in the cart for this book in this colour,
 * same as clicking "add to cart" once used to increment by exactly one.
 *
 * `colorId` is required exactly when the book has colours, and is checked
 * here against the book as it is now, not as the page the visitor is looking
 * at last showed it.
 */
export async function addToCart(bookId: number, locale: string, quantity: number = 1, colorId: string | null = null): Promise<ActionResult> {
  if (!isLocale(locale)) return { ok: false, error: 'invalid-locale' }
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: 'invalid-quantity' }

  const payload = await getPayload({ config })
  const book = await payload.findByID({ collection: 'books', id: bookId }).catch(() => null)
  if (!book) return { ok: false, error: 'not-found' }
  if (!isPurchasable(book, LOCALE_CONFIG[locale].currency)) return { ok: false, error: 'not-purchasable' }
  if (!chooseColor(book.colors, colorId).ok) return { ok: false, error: 'invalid-color' }

  const cart = await getOrCreateCart()
  const items = toItemInput(cart.items ?? [])
  const existing = items.find((item) => isLine(item, { bookId, colorId }))
  if (existing) existing.quantity += quantity
  else items.push({ book: bookId, colorId, quantity })

  await payload.update({ collection: 'carts', id: cart.id, data: { items } })
  return { ok: true }
}

export async function updateCartQuantity(line: CartLineKey, quantity: number): Promise<ActionResult> {
  const payload = await getPayload({ config })
  const cart = await getOrCreateCart()
  const items = toItemInput(cart.items ?? []).filter((item) => (isLine(item, line) ? quantity > 0 : true))
  const target = items.find((item) => isLine(item, line))
  if (target) target.quantity = quantity

  await payload.update({ collection: 'carts', id: cart.id, data: { items } })
  return { ok: true }
}

export async function removeFromCart(line: CartLineKey): Promise<ActionResult> {
  const payload = await getPayload({ config })
  const cart = await getOrCreateCart()
  const items = toItemInput(cart.items ?? []).filter((item) => !isLine(item, line))

  await payload.update({ collection: 'carts', id: cart.id, data: { items } })
  return { ok: true }
}

export async function getCartItemCount(): Promise<number> {
  return readCartItemCount()
}
