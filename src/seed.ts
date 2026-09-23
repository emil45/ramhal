import type { Payload } from 'payload'

import { DEFAULT_SOCIAL_LINKS } from './lib/socialLinks'

type LocalizedText = { en: string; fr: string; he: string }

// Seed values per docs/DECISIONS.md §7 (shipping) / §13 (categories describe
// a kind of work, never a language — hebrew-books/french-books/english-books
// were removed for exactly that reason and must not be re-added here).
const CATEGORIES: { slug: string; title: LocalizedText }[] = [
  {
    slug: 'siddurim-machzorim',
    title: { he: 'סידורים ומחזורים', en: 'Siddurim and Machzorim', fr: "Sidourim et Ma'hzorim" },
  },
]

const EUROPE_COUNTRIES = ['FR', 'BE', 'CH', 'DE', 'IT', 'ES', 'NL', 'AT', 'GB', 'PT', 'LU']
const REST_OF_WORLD_COUNTRIES = ['US', 'CA', 'AU', 'ZA', 'BR', 'MX']

/**
 * Creates the category by slug if it does not already exist. Does nothing
 * otherwise — a category the son has since retitled must survive every
 * later boot untouched (an earlier version restored these titles on every
 * restart, silently erasing his edits).
 */
async function upsertCategory(payload: Payload, entry: (typeof CATEGORIES)[number]): Promise<void> {
  const existing = await payload.find({
    collection: 'categories',
    where: { slug: { equals: entry.slug } },
    limit: 1,
  })
  if (existing.docs.length > 0) return

  const created = await payload.create({
    collection: 'categories',
    locale: 'he',
    data: { title: entry.title.he, slug: entry.slug },
  })
  await payload.update({ collection: 'categories', id: created.id, locale: 'en', data: { title: entry.title.en } })
  await payload.update({ collection: 'categories', id: created.id, locale: 'fr', data: { title: entry.title.fr } })
}

/**
 * Writes the default zones only when none exist yet. A zone the son has
 * since edited (or deleted) must survive every later boot untouched.
 */
async function seedShippingSettings(payload: Payload): Promise<void> {
  const existing = await payload.findGlobal({ slug: 'shippingSettings' })
  if (existing.zones && existing.zones.length > 0) return

  await payload.updateGlobal({
    slug: 'shippingSettings',
    data: {
      zones: [
        {
          name: 'ישראל',
          countries: ['IL'],
          currency: 'ILS',
          tiers: [{ minUnits: 0, amount: 30 }],
          freeAboveUnits: 10,
          allowPickup: true,
          isDefault: false,
        },
        {
          name: 'אירופה',
          countries: EUROPE_COUNTRIES,
          currency: 'EUR',
          tiers: [{ minUnits: 0, amount: 50 }],
          freeAboveUnits: 10,
          allowPickup: false,
          isDefault: false,
        },
        {
          name: 'שאר העולם',
          countries: REST_OF_WORLD_COUNTRIES,
          currency: 'USD',
          tiers: [{ minUnits: 0, amount: 86 }],
          freeAboveUnits: 10,
          allowPickup: false,
          isDefault: true,
        },
      ],
    },
  })
}

/**
 * Writes the default schedule only when none exists yet — same reasoning as
 * seedShippingSettings above.
 */
async function seedSchedule(payload: Payload): Promise<void> {
  const existing = await payload.findGlobal({ slug: 'schedule', locale: 'he' })
  if ((existing.shiurim && existing.shiurim.length > 0) || (existing.prayers && existing.prayers.length > 0)) return

  await payload.updateGlobal({
    slug: 'schedule',
    locale: 'he',
    data: {
      shiurim: [
        { title: 'דרך ה׳', days: 'א׳–ה׳', time: 'בין מנחה לערבית' },
        { title: 'אדיר במרום', days: 'יום ג׳', time: '20:30' },
        { title: 'תיקונים חדשים', days: 'יום ה׳', time: '21:00' },
      ],
      prayers: [
        { name: 'שחרית', time: 'נץ החמה' },
        { name: 'מנחה', time: '19:00' },
        { name: 'ערבית', time: '20:00' },
      ],
    },
  })
}

// Contact details as the legacy sites publish them.
// The two legacy sites list different emails; this is the Hebrew site's, which
// is the institute's primary one. The son corrects it in the admin.
const CONTACT_ADDRESS: LocalizedText = {
  he: 'הרב רפאל קצנלבוגן 73, ירושלים',
  en: '73 Katzenelbogen St, Jerusalem 91431, Israel',
  fr: '73 rue Katzenelbogen, Jérusalem 91431, Israël',
}
const CONTACT_PHONE = '+972-2-653-5101'
const CONTACT_EMAIL = 'ramhalcom@gmail.com'

/**
 * Writes the contact details only when none exist yet — same reasoning as
 * seedShippingSettings above.
 */
async function seedContactDetails(payload: Payload): Promise<void> {
  const existing = await payload.findGlobal({ slug: 'siteSettings', locale: 'he' })
  if (existing.contact?.address || existing.contact?.phone || existing.contact?.email) return

  await payload.updateGlobal({
    slug: 'siteSettings',
    locale: 'he',
    data: { contact: { address: CONTACT_ADDRESS.he, phone: CONTACT_PHONE, email: CONTACT_EMAIL } },
  })
  await payload.updateGlobal({ slug: 'siteSettings', locale: 'en', data: { contact: { address: CONTACT_ADDRESS.en } } })
  await payload.updateGlobal({ slug: 'siteSettings', locale: 'fr', data: { contact: { address: CONTACT_ADDRESS.fr } } })
}

/** Initialises the institute's accounts only when an editor has not already
 * created any social links. Once the array has content, the admin owns it. */
async function seedSocialLinks(payload: Payload): Promise<void> {
  const existing = await payload.findGlobal({ slug: 'siteSettings', locale: 'he' })
  if (existing.socialLinks && existing.socialLinks.length > 0) return

  await payload.updateGlobal({
    slug: 'siteSettings',
    locale: 'he',
    data: { socialLinks: DEFAULT_SOCIAL_LINKS },
  })
}

/**
 * Runs explicitly through `npm run seed` and remains safe to repeat on a
 * database the son has already been editing for months, not just on a fresh
 * one. Every write above is initialise-if-
 * missing, never overwrite-if-present — the previous unconditional-update
 * version restored default category titles, shipping rates, and the
 * timetable on every restart, silently erasing his edits. Verified by
 * editing a shipping rate in the admin, restarting, and confirming the edit
 * survives.
 */
export async function seed(payload: Payload): Promise<void> {
  for (const category of CATEGORIES) {
    await upsertCategory(payload, category)
  }
  await seedShippingSettings(payload)
  await seedSchedule(payload)
  await seedContactDetails(payload)
  await seedSocialLinks(payload)
}
