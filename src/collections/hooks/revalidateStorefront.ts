// The extension is required: seed and the scripts load this file under plain
// Node ESM, which does not resolve extensionless subpaths of `next`.
import { revalidatePath } from 'next/cache.js'

import type { RequestContext } from 'payload'

/**
 * Context for a Payload write made outside a Next.js request — seed, import,
 * one-off scripts, tests. `revalidatePath` has no request to act on there and
 * throws, so such a write opts out explicitly.
 */
export const SKIP_STOREFRONT_REVALIDATION = { disableRevalidate: true } as const

/**
 * Marks every storefront page stale after any change to content it renders;
 * each re-renders on its next visit. Deliberately not a per-page map: with
 * rare edits and lazy re-rendering, a map would only add a place to forget an
 * entry. Usable as a collection afterChange, afterDelete or global afterChange.
 */
export function revalidateStorefront({ context }: { context: RequestContext }): void {
  if (context.disableRevalidate) return
  revalidatePath('/', 'layout')
}
