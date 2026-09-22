#!/usr/bin/env vite-node
// One-time repair for the TASK-29 flyer. TASK-29 created the Media row through
// a development config, so the shared demo database referenced a file that
// existed only in the ignored local media directory. This replaces that file
// through Payload while the demo's S3-compatible storage plugin is enabled.

import { fileURLToPath } from 'node:url'

if (process.env.APP_ENV !== 'demo') {
  throw new Error('Refusing to repair the news flyer unless APP_ENV is demo.')
}

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config.ts')

const filename = 'machzor-hamelech-hamishpat-2026-09-06.webp'
const filePath = fileURLToPath(new URL(`../../assets/news/prepared/${filename}`, import.meta.url))
const alternativeText = {
  he: 'עלון המחזור החדש ״המלך והמשפט״ וכנס ראש השנה בבית רמח״ל',
  en: 'Flyer for the new “HaMelekh HaMishpat” machzor and a Rosh Hashanah event at Beit Ramhal',
  fr: 'Affiche du nouveau ma’hzor « HaMelekh HaMishpat » et d’un événement de Roch Hachana à Beit Ramhal',
}

const payload = await getPayload({ config })

try {
  const existing = await payload.find({
    collection: 'media',
    locale: 'he',
    fallbackLocale: false,
    where: { filename: { equals: filename } },
    limit: 1,
  })
  const media = existing.docs[0]

  if (!media) {
    throw new Error(`Media record ${filename} does not exist; refusing to create an unattached replacement.`)
  }

  const repaired = await payload.update({
    collection: 'media',
    id: media.id,
    locale: 'he',
    data: { alt: alternativeText.he },
    filePath,
    overwriteExistingFiles: true,
  })

  await payload.update({ collection: 'media', id: repaired.id, locale: 'en', data: { alt: alternativeText.en } })
  await payload.update({ collection: 'media', id: repaired.id, locale: 'fr', data: { alt: alternativeText.fr } })

  console.log(
    JSON.stringify(
      {
        id: repaired.id,
        filename: repaired.filename,
        width: repaired.width,
        height: repaired.height,
        sizes: Object.fromEntries(
          Object.entries(repaired.sizes ?? {}).map(([name, size]) => [name, size?.filename ?? null]),
        ),
      },
      null,
      2,
    ),
  )
} finally {
  await payload.destroy()
}

process.exit(0)
