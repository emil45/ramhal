import { hasValueInAnyLocale } from '../../lib/localizedField.ts'

import type { CollectionSlug, TextFieldSingleValidation } from 'payload'

const REQUIRED_MESSAGE = 'שדה זה נדרש בלפחות שפה אחת.'

/**
 * A title field that is required IN AT LEAST ONE LOCALE, never in whichever
 * locale the admin currently has open. The field itself must be configured
 * `required: false` — Payload derives the database's `NOT NULL` constraint
 * from that static flag regardless of a custom `validate` (confirmed by
 * reading Payload's own field-validation code; see
 * docs/tasks/TASK-32-admin-facelift.md §1b), and a French-only book
 * genuinely has no `he` row to be non-null in. This function is what
 * actually enforces "required," unconditionally, in its place.
 *
 * Costs one extra `findByID(locale: 'all')` per save when the current
 * locale's value is blank — negligible at this catalogue's size and
 * frequency of edits (see the task brief for the sizing argument).
 */
export function requiredInAtLeastOneLocale(collectionSlug: CollectionSlug): TextFieldSingleValidation {
  return async (value, { req, id }) => {
    if (typeof value === 'string' && value.trim().length > 0) return true
    // A brand-new document has nothing else to fall back to.
    if (id === undefined || id === null) return REQUIRED_MESSAGE

    const existing = await req.payload.findByID({
      id,
      collection: collectionSlug,
      depth: 0,
      locale: 'all',
      overrideAccess: true,
      req,
    })

    return hasValueInAnyLocale((existing as { title?: Record<string, unknown> })?.title) || REQUIRED_MESSAGE
  }
}
