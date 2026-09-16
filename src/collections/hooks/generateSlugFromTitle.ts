import type { FieldHook } from 'payload'

import { slugify } from '@/lib/slugify'

/**
 * Fills the slug from the title when the editor leaves it blank, without
 * overwriting a slug someone typed on purpose. Used on books, categories and
 * pages, which all need "generate it, but let an editor override it."
 */
export const generateSlugFromTitle: FieldHook = ({ data, value }) => {
  if (value) return value
  if (typeof data?.title === 'string' && data.title.length > 0) {
    return slugify(data.title)
  }
  return value
}
