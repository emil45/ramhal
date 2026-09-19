import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import type { SiteSetting } from '@/payload-types'
import type { Locale } from '@/lib/locale'

/** The institute's contact details, as the son maintains them in the admin. */
export async function getContactDetails(locale: Locale): Promise<NonNullable<SiteSetting['contact']>> {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'siteSettings', locale })
  return settings.contact ?? {}
}
