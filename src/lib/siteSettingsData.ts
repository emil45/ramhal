import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { resolveSocialLinks } from '@/lib/socialLinks'
import type { Media, SiteSetting } from '@/payload-types'
import type { Locale } from '@/lib/locale'

const getSiteSettings = cache(async (locale: Locale): Promise<SiteSetting> => {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'siteSettings', locale })
})

/** The institute's contact details, as the son maintains them in the admin. */
export async function getContactDetails(locale: Locale): Promise<NonNullable<SiteSetting['contact']>> {
  const settings = await getSiteSettings(locale)
  return settings.contact ?? {}
}

/** The supported account links, with malformed legacy values excluded from the storefront. */
export async function getSocialLinks(locale: Locale) {
  const settings = await getSiteSettings(locale)
  return resolveSocialLinks(settings.socialLinks)
}

/** The /donate page's hero photo, as the son maintains it in the admin. */
export async function getDonatePhoto(locale: Locale): Promise<Media | null> {
  const settings = await getSiteSettings(locale)
  return (settings.donatePhoto as Media | null) ?? null
}
