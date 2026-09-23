import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'

/** A narrative page (`/ramhal`, `/rabbi-chriqui`, `/beit-ramhal`) by its
 * fixed slug — content the son maintains in the admin. `null` when the page
 * hasn't been created yet; callers call `notFound()`. */
export const getPageBySlug = cache(async (slug: string, locale: Locale): Promise<Page | null> => {
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, locale, limit: 1 })
  return result.docs[0] ?? null
})
