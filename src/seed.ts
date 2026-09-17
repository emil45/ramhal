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
 * Finds or creates the category by slug, then writes the title in all three
 * locales unconditionally — this is what makes it safe to run twice, and
 * what fixes a category that was previously created (by hand or by an
 * earlier run) with only some locales filled in.
 */
async function upsertCategory(payload: Payload, entry: (typeof CATEGORIES)[number]): Promise<void> {
  const existing = await payload.find({
    collection: 'categories',
    where: { slug: { equals: entry.slug } },
    limit: 1,
  })

  const id =
    existing.docs[0]?.id ??
    (
      await payload.create({
        collection: 'categories',
        locale: 'he',
        data: { title: entry.title.he, slug: entry.slug },
      })
    ).id

  await payload.update({ collection: 'categories', id, locale: 'he', data: { title: entry.title.he } })
  await payload.update({ collection: 'categories', id, locale: 'en', data: { title: entry.title.en } })
  await payload.update({ collection: 'categories', id, locale: 'fr', data: { title: entry.title.fr } })
}

async function seedShippingSettings(payload: Payload): Promise<void> {
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

async function seedSchedule(payload: Payload): Promise<void> {
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
 * Idempotent: every write here is either an unconditional global update
 * (globals are singletons — writing the same values twice is a no-op in
 * effect) or a find-then-upsert-by-slug, so running this on every server
 * boot (see `onInit` in payload.config.ts) or by hand is always safe.
 */
export async function seed(payload: Payload): Promise<void> {
  for (const category of CATEGORIES) {
    await upsertCategory(payload, category)
  }
  await seedShippingSettings(payload)
  await seedSchedule(payload)
}
