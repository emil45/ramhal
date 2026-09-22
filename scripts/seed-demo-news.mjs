#!/usr/bin/env vite-node

import { fileURLToPath } from 'node:url'

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
const FLYER_FILENAME = 'machzor-hamelech-hamishpat-2026-09-06.webp'
const FLYER_FILE_PATH = fileURLToPath(new URL(`../assets/news/prepared/${FLYER_FILENAME}`, import.meta.url))
const HAS_HEBREW = /[֐-׿]/
const LOCALES = ['he', 'en', 'fr']
const FLYER_ALT = {
  he: 'עלון המחזור החדש ״המלך והמשפט״ וכנס ראש השנה בבית רמח״ל',
  en: 'Flyer for the new “HaMelekh HaMishpat” machzor and a Rosh Hashanah event at Beit Ramhal',
  fr: 'Affiche du nouveau ma’hzor « HaMelekh HaMishpat » et d’un événement de Roch Hachana à Beit Ramhal',
}

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
    image: FLYER_FILENAME,
    previousHebrewTitle: 'מהדורה חדשה מבית המכון',
    startsAt: new Date(now - DAY_IN_MILLISECONDS).toISOString(),
    endsAt: new Date(now + 30 * DAY_IN_MILLISECONDS).toISOString(),
    url: 'https://ramhal.com',
    localized: {
      he: {
        title: 'מהדורה חדשה למחזור ״המלך והמשפט״',
        body: 'מחזור לראש השנה במהדורה חדשה ומתוקנת, בסט מהודר ובפורמט קטן, זמין במכון רמח״ל.',
        linkLabel: 'לפרטים באתר',
      },
      en: {
        title: 'New edition of the “HaMelekh HaMishpat” machzor',
        body: 'A newly corrected, compact Rosh Hashanah machzor set is now available from the Ramhal Institute.',
        linkLabel: 'Details on the site',
      },
      fr: {
        title: 'Nouvelle édition du ma’hzor « HaMelekh HaMishpat »',
        body: 'Une nouvelle édition corrigée et compacte du ma’hzor de Roch Hachana est disponible auprès de l’Institut Ramhal.',
        linkLabel: 'Détails sur le site',
      },
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

async function upsertFlyer(payload) {
  const existing = await payload.find({
    collection: 'media',
    locale: 'he',
    fallbackLocale: false,
    where: { filename: { equals: FLYER_FILENAME } },
    limit: 1,
  })

  const media = existing.docs[0]
    ? await payload.update({ collection: 'media', id: existing.docs[0].id, locale: 'he', data: { alt: FLYER_ALT.he } })
    : await payload.create({ collection: 'media', locale: 'he', data: { alt: FLYER_ALT.he }, filePath: FLYER_FILE_PATH })

  for (const locale of LOCALES.slice(1)) {
    await payload.update({ collection: 'media', id: media.id, locale, data: { alt: FLYER_ALT[locale] } })
  }

  return media
}

async function upsertRecord(payload, record, mediaByFilename) {
  const hebrewTitles = [record.localized.he.title, record.previousHebrewTitle].filter(Boolean)
  const existing = await payload.find({
    collection: record.collection,
    locale: 'he',
    fallbackLocale: false,
    where: { title: { in: hebrewTitles } },
    limit: 1,
  })

  const sharedData = {
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    ...(record.image ? { image: mediaByFilename.get(record.image)?.id } : {}),
  }
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
  const flyer = await upsertFlyer(payload)
  const mediaByFilename = new Map([[FLYER_FILENAME, flyer]])
  for (const record of records) await upsertRecord(payload, record, mediaByFilename)
  payload.logger.info('Demo news and its real flyer seeded in Hebrew, English, and French.')
} finally {
  await payload.destroy()
}

process.exit(0)
