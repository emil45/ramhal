import { pickDisplayTitle } from '../../lib/localizedField.ts'

import type { CollectionBeforeChangeHook, CollectionSlug } from 'payload'

/**
 * `displayTitle`/`displayTitleLocale` (localizedDisplayTitleFields.ts) must
 * be real, stored fields — Payload refuses a virtual field as `useAsTitle`
 * unless it is linked to a relationship (confirmed by Payload's own
 * `validateUseAsTitle`, thrown at config-build time when this was first
 * tried as a virtual `afterRead` field). So the he -> fr -> en pick is
 * computed once here, at save time, not on every read.
 *
 * Reads the document's other locales with one `findByID(locale: 'all')` on
 * `update` (skipped on `create`, where there is nothing yet to read), then
 * folds in whatever locale this very request is writing — `data.title` is
 * only the incoming locale's value, not yet persisted when this hook runs.
 */
export function computeDisplayTitleBeforeChange(collectionSlug: CollectionSlug): CollectionBeforeChangeHook {
  return async ({ data, operation, originalDoc, req }) => {
    const titlesByLocale: Record<string, unknown> = {}

    if (operation === 'update' && originalDoc?.id !== undefined && originalDoc?.id !== null) {
      // createLocalReq mutates the request object it receives when applying a
      // requested locale. Passing the live write request to this `locale:
      // 'all'` lookup therefore changed req.locale to `all`; Payload's later
      // localized-field merge then found no matching locale and silently
      // restored the old values over every localized edit. Keep the current
      // transaction and context, but isolate those locale mutations on a
      // shallow request copy.
      const allLocalesRequest = { ...req }
      const existing = await req.payload.findByID({
        id: originalDoc.id,
        collection: collectionSlug,
        depth: 0,
        locale: 'all',
        overrideAccess: true,
        req: allLocalesRequest,
      })
      Object.assign(titlesByLocale, (existing as { title?: Record<string, unknown> })?.title)
    }

    if (req.locale && req.locale !== 'all' && typeof data.title !== 'undefined') {
      titlesByLocale[req.locale] = data.title
    }

    const picked = pickDisplayTitle(titlesByLocale)
    data.displayTitle = picked?.title ?? null
    data.displayTitleLocale = picked?.locale ?? null
    return data
  }
}
