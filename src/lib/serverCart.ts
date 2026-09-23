import 'server-only'

import config from '@payload-config'
import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

import type { Book, Cart } from '@/payload-types'
import type { Locale } from '@/lib/locale'

// httpOnly, server-only session cookie — not localStorage, so checkout and
// the count-based shipping tiers can both read the cart from the server.
const CART_COOKIE = 'ramhal_cart_session'
const CART_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180 // 180 days

export type CartLine = {
  book: Book
  quantity: number
}

async function payloadClient() {
  return getPayload({ config })
}

/** Read-only: the session id if a cart cookie already exists, else null.
 * Never creates one — cookies can only be written from a Server Function or
 * Route Handler, not while rendering a page (see cartActions.ts for the
 * writing half). */
async function readSessionId(): Promise<string | null> {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value ?? null
}

/** Creates the session cookie if missing. Only callable from a Server
 * Action or Route Handler. */
export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies()
  const existing = store.get(CART_COOKIE)?.value
  if (existing) return existing

  const sessionId = randomUUID()
  store.set(CART_COOKIE, sessionId, {
    httpOnly: true,
    maxAge: CART_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return sessionId
}

async function findCartBySessionId(sessionId: string, locale?: Locale): Promise<Cart | null> {
  const payload = await payloadClient()
  const result = await payload.find({
    collection: 'carts',
    where: { sessionId: { equals: sessionId } },
    depth: 1,
    limit: 1,
    locale,
  })
  return result.docs[0] ?? null
}

/** The cart's lines, resolved to full Book documents in the given locale.
 * Empty when no session cookie exists yet — a first-time visitor's cart is
 * empty, not an error. */
export async function getCartLines(locale: Locale): Promise<CartLine[]> {
  const sessionId = await readSessionId()
  if (!sessionId) return []

  const cart = await findCartBySessionId(sessionId, locale)
  if (!cart) return []

  return (cart.items ?? [])
    .filter((item): item is typeof item & { book: Book } => typeof item.book === 'object' && item.book !== null)
    .map((item) => ({ book: item.book, quantity: item.quantity }))
}

export type CartItem = {
  bookId: number
  quantity: number
}

/** The cart as plain book ids and quantities, for checkout: it re-reads
 * every book from the database itself rather than trusting a book document
 * loaded for display. */
export async function getCartItems(): Promise<CartItem[]> {
  const sessionId = await readSessionId()
  if (!sessionId) return []

  const cart = await findCartBySessionId(sessionId)
  if (!cart) return []

  return (cart.items ?? []).flatMap((item) => {
    const bookId = typeof item.book === 'object' ? item.book?.id : item.book
    return bookId === undefined || bookId === null ? [] : [{ bookId, quantity: item.quantity }]
  })
}

/** Total copies in the cart — what the header's cart badge shows. */
export async function getCartItemCount(): Promise<number> {
  const items = await getCartItems()
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

/** Empties the session's cart. Only callable from a Server Action or Route
 * Handler. Checkout calls this once the order is paid — never before, so a
 * declined or abandoned payment leaves the customer's cart intact. */
export async function clearCart(): Promise<void> {
  const sessionId = await readSessionId()
  if (!sessionId) return

  const cart = await findCartBySessionId(sessionId)
  if (!cart) return

  const payload = await payloadClient()
  await payload.update({ collection: 'carts', id: cart.id, data: { items: [] } })
}

/** Gets the session's cart, creating both the session and the cart document
 * if neither exists yet. Only callable from a Server Action or Route
 * Handler (getOrCreateSessionId writes a cookie). */
export async function getOrCreateCart(): Promise<Cart> {
  const sessionId = await getOrCreateSessionId()
  const payload = await payloadClient()

  const existing = await findCartBySessionId(sessionId)
  if (existing) return existing

  return payload.create({ collection: 'carts', data: { sessionId, items: [] } })
}
