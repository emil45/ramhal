/** Fired after anything changes the cart, so the header's item count — which
 * lives outside the page being edited — can fetch the new number. */
export const CART_CHANGED_EVENT = 'ramhal:cart-changed'

export function announceCartChange(): void {
  window.dispatchEvent(new Event(CART_CHANGED_EVENT))
}
