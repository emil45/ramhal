#!/usr/bin/env vite-node

try {
  process.loadEnvFile('.env')
} catch {
  // CI and hosted environments provide variables through the process environment.
}

if (process.env.APP_ENV === 'production') {
  throw new Error('Refusing to seed demo news when APP_ENV is production.')
}

const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config.ts')

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000
const HAS_HEBREW = /[֐-׿]/
const LOCALES = ['he', 'en', 'fr']

function richText(text) {
  const direction = HAS_HEBREW.test(text) ? 'rtl' : 'ltr'
  return {
    root: {
      type: 'root',
      direction,
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          direction,
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          version: 1,
          children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
        },
      ],
    },
  }
}

const now = Date.now()
const records = [
  {
    collection: 'events',
    startsAt: new Date(now + 14 * DAY_IN_MILLISECONDS).toISOString(),
    endsAt: new Date(now + 14 * DAY_IN_MILLISECONDS + 3 * 60 * 60 * 1000).toISOString(),
    localized: {
      he: { title: 'ערב לימוד לכבוד הילולת הרמח״ל', body: 'שיעורים מפי רבני המכון וערבית חגיגית.', location: 'בית רמח״ל, הר נוף' },
      en: { title: 'An evening of learning for the Ramhal’s hilula', body: 'Classes with the institute’s rabbis, followed by Maariv.', location: 'Beit Ramhal, Har Nof' },
      fr: { title: 'Soirée d’étude pour la hiloula du Ramhal', body: "Cours avec les rabbins de l’institut, suivis d’Arvit.", location: 'Beit Ramhal, Har Nof' },
    },
  },
  {
    collection: 'announcements',
    startsAt: new Date(now - DAY_IN_MILLISECONDS).toISOString(),
    endsAt: new Date(now + 30 * DAY_IN_MILLISECONDS).toISOString(),
    url: 'https://ramhal.com',
    localized: {
      he: { title: 'מהדורה חדשה מבית המכון', body: 'מהדורה חדשה ומוגהת הצטרפה לקטלוג ספרי המכון.', linkLabel: 'לספר בחנות' },
      en: { title: 'A new edition from the institute', body: 'A newly corrected edition has joined the institute’s catalogue.', linkLabel: 'View the book' },
      fr: { title: "Une nouvelle édition de l’institut", body: "Une nouvelle édition révisée rejoint le catalogue de l’institut.", linkLabel: 'Voir le livre' },
    },
  },
  {
    collection: 'announcements',
    startsAt: new Date(now - 2 * DAY_IN_MILLISECONDS).toISOString(),
    endsAt: new Date(now + 30 * DAY_IN_MILLISECONDS).toISOString(),
    localized: {
      he: { title: 'שעות פתיחת בית המדרש', body: 'בית המדרש פתוח ללימוד בימים א׳–ה׳ בשעות הפעילות הרגילות.' },
      en: { title: 'Beit midrash opening hours', body: 'The beit midrash is open for learning Sunday through Thursday during its usual hours.' },
      fr: { title: "Horaires d’ouverture du beit hamidrach", body: "Le beit hamidrach est ouvert à l’étude du dimanche au jeudi aux horaires habituels." },
    },
  },
]

function dataForLocale(record, locale) {
  const content = record.localized[locale]
  const data = { title: content.title }

  if (record.collection === 'events') {
    data.description = richText(content.body)
    data.location = content.location
  } else {
    data.body = richText(content.body)
  }

  if (content.linkLabel && record.url) {
    data.link = { label: content.linkLabel, url: record.url }
  }

  return data
}

async function upsertRecord(payload, record) {
  const existing = await payload.find({
    collection: record.collection,
    locale: 'he',
    fallbackLocale: false,
    where: { title: { equals: record.localized.he.title } },
    limit: 1,
  })

  const sharedData = { startsAt: record.startsAt, endsAt: record.endsAt }
  const hebrewData = { ...sharedData, ...dataForLocale(record, 'he') }
  const document = existing.docs[0]
    ? await payload.update({ collection: record.collection, id: existing.docs[0].id, locale: 'he', data: hebrewData })
    : await payload.create({ collection: record.collection, locale: 'he', data: hebrewData })

  for (const locale of LOCALES.slice(1)) {
    await payload.update({ collection: record.collection, id: document.id, locale, data: dataForLocale(record, locale) })
  }
}

const payload = await getPayload({ config })

try {
  for (const record of records) await upsertRecord(payload, record)
  payload.logger.info('Demo news seeded in Hebrew, English, and French.')
} finally {
  await payload.destroy()
}

process.exit(0)
