import type { Payload } from 'payload'

type LocalizedText = { en: string; fr: string; he: string }

// Seed values from docs/tasks/TASK-01-payload-setup.md §4-5 and
// docs/DECISIONS.md §8 (shipping). English/French category names are
// straightforward translations; nothing else in the brief specified them.
const CATEGORIES: { slug: string; title: LocalizedText }[] = [
  { slug: 'hebrew-books', title: { he: 'ספרים בעברית', en: 'Hebrew Books', fr: 'Livres en hébreu' } },
  { slug: 'french-books', title: { he: 'ספרים בצרפתית', en: 'French Books', fr: 'Livres en français' } },
  { slug: 'english-books', title: { he: 'ספרים באנגלית', en: 'English Books', fr: 'Livres en anglais' } },
  {
    slug: 'siddurim-machzorim',
    title: { he: 'סידורים ומחזורים', en: 'Siddurim and Machzorim', fr: "Sidourim et Ma'hzorim" },
  },
  { slug: 'cd-dvd', title: { he: 'CD/DVD', en: 'CD/DVD', fr: 'CD/DVD' } },
]

const EUROPE_COUNTRIES = ['FR', 'BE', 'CH', 'DE', 'IT', 'ES', 'NL', 'AT', 'GB', 'PT', 'LU']
const REST_OF_WORLD_COUNTRIES = ['US', 'CA', 'AU', 'ZA', 'BR', 'MX']

/**
 * Creates the category by slug if it does not already exist. Does nothing
 * otherwise — a category the son has since retitled must survive every
 * later boot untouched (see docs/reviews/REVIEW-01-findings.md #1; every
 * restart used to restore these titles, silently erasing his edits).
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
 * since edited (or deleted) must survive every later boot untouched — see
 * docs/reviews/REVIEW-01-findings.md #1.
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
          tiers: [{ minUnits: 0, amount: 3000 }],
          freeAboveUnits: 10,
          allowPickup: true,
          isDefault: false,
        },
        {
          name: 'אירופה',
          countries: EUROPE_COUNTRIES,
          currency: 'EUR',
          tiers: [{ minUnits: 0, amount: 5000 }],
          freeAboveUnits: 10,
          allowPickup: false,
          isDefault: false,
        },
        {
          name: 'שאר העולם',
          countries: REST_OF_WORLD_COUNTRIES,
          currency: 'USD',
          tiers: [{ minUnits: 0, amount: 8600 }],
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

/**
 * Runs on every server boot (see `onInit` in payload.config.ts), so it must
 * be safe to call on a database the son has already been editing for
 * months, not just on a fresh one. Every write above is initialise-if-
 * missing, never overwrite-if-present — the previous unconditional-update
 * version restored default category titles, shipping rates, and the
 * timetable on every restart, silently erasing his edits (see
 * docs/reviews/REVIEW-01-findings.md #1). Verified by editing a shipping
 * rate in the admin, restarting, and confirming the edit survives — see
 * docs/reports/TASK-05.md.
 */
export async function seed(payload: Payload): Promise<void> {
  for (const category of CATEGORIES) {
    await upsertCategory(payload, category)
  }
  await seedShippingSettings(payload)
  await seedSchedule(payload)
}
