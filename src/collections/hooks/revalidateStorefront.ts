// The extensions are required: seed and the scripts load this file under plain
// Node ESM, which does not resolve extensionless subpaths of `next`.
import { revalidatePath } from 'next/cache.js'
import { after } from 'next/server.js'

import type { RequestContext } from 'payload'

/**
 * Context for a Payload write made outside a Next.js request — seed, import,
 * one-off scripts, tests. There is no request to schedule work after, so
 * `after` throws there; such a write opts out explicitly.
 */
export const SKIP_STOREFRONT_REVALIDATION = { disableRevalidate: true } as const

/**
 * Marks every storefront page stale after any change to content it renders;
 * each re-renders on its next visit. Deliberately not a per-page map: with
 * rare edits and lazy re-rendering, a map would only add a place to forget an
 * entry. Usable as a collection afterChange, afterDelete or global afterChange.
 *
 * Payload runs these hooks inside the write's transaction, before it commits.
 * A visitor arriving in between would re-render from the old data, and pages
 * never expire on a timer, so that page would stay wrong until the next edit.
 * `after` runs the revalidation once the request has finished, which is after
 * the commit.
 */
export function revalidateStorefront({ context }: { context: RequestContext }): void {
  if (context.disableRevalidate) return
  after(() => revalidatePath('/', 'layout'))
}
