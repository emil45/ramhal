import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { he } from '@payloadcms/translations/languages/he'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import sharp from 'sharp'

const dirname = path.dirname(fileURLToPath(import.meta.url))

import { Announcements } from '@/collections/Announcements'
import { Articles } from '@/collections/Articles'
import { Books } from '@/collections/Books'
import { Categories } from '@/collections/Categories'
import { Events } from '@/collections/Events'
import { Lessons } from '@/collections/Lessons'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Series } from '@/collections/Series'
import { Users } from '@/collections/Users'
import { Schedule } from '@/globals/Schedule'
import { ShippingSettings } from '@/globals/ShippingSettings'
import { SiteSettings } from '@/globals/SiteSettings'
import { requireEnv } from '@/lib/env'

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  editor: lexicalEditor(),
  collections: [Users, Media, Books, Categories, Series, Lessons, Articles, Pages, Announcements, Events],
  globals: [Schedule, ShippingSettings, SiteSettings],
  secret: requireEnv('PAYLOAD_SECRET'),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: requireEnv('DATABASE_URI'),
    },
  }),
  sharp,
  // Hebrew is the root locale; English and French are prefixed. The scheme
  // extends to a fourth language by adding one entry here — see
  // docs/tasks/TASK-01-payload-setup.md §2.
  localization: {
    locales: [
      { code: 'he', label: 'עברית', rtl: true },
      { code: 'en', label: 'English' },
      { code: 'fr', label: 'Français' },
    ],
    defaultLocale: 'he',
    // Global default is off: a missing prose translation must read as absent,
    // not backfilled with Hebrew — see docs/tasks/TASK-01-payload-setup.md §2.
    // Structural reads (e.g. admin list columns) that want a fallback ask for
    // it explicitly per request via Payload's `fallbackLocale` query option.
    fallback: false,
  },
  // The admin UI's own language ships built into Payload — set it, translate
  // nothing by hand. There is one admin persona (the son) and he is Hebrew-
  // speaking, so Hebrew is the only supported admin language: Payload
  // negotiates against the browser's Accept-Language before falling back,
  // and registering en/fr here would let an English-configured browser pull
  // the admin into English. Content locales (he/en/fr) are unaffected — see
  // `localization` above.
  i18n: {
    supportedLanguages: { he },
    fallbackLanguage: 'he',
  },
})
