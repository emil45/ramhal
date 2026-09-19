import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { he } from '@payloadcms/translations/languages/he'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import sharp from 'sharp'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Relative, extensioned imports below — not the `@/` alias used elsewhere in
// the app. Payload's CLI (migrate, generate:types) loads this file through a
// nested tsx worker that resolves modules with Node's own ESM algorithm, not
// Turbopack's, and does not follow tsconfig `paths`. See
// https://github.com/payloadcms/payload/issues/16684.
import { Announcements } from './collections/Announcements.ts'
import { Articles } from './collections/Articles.ts'
import { Books } from './collections/Books.ts'
import { Carts } from './collections/Carts.ts'
import { Categories } from './collections/Categories.ts'
import { Events } from './collections/Events.ts'
import { Lessons } from './collections/Lessons.ts'
import { Media } from './collections/Media.ts'
import { MockPaymentSessions } from './collections/MockPaymentSessions.ts'
import { Orders } from './collections/Orders.ts'
import { Pages } from './collections/Pages.ts'
import { PaymentEvents } from './collections/PaymentEvents.ts'
import { Series } from './collections/Series.ts'
import { Users } from './collections/Users.ts'
import { Schedule } from './globals/Schedule.ts'
import { ShippingSettings } from './globals/ShippingSettings.ts'
import { SiteSettings } from './globals/SiteSettings.ts'
import { requireEnv } from './lib/env.ts'
import { seed } from './seed.ts'

export default buildConfig({
  admin: {
    user: Users.slug,
    // Custom admin components are referenced by path from here (src/), not
    // from the working directory Payload would otherwise assume.
    importMap: { baseDir: path.resolve(dirname) },
  },
  // Idempotent — see src/seed.ts. Runs on every boot instead of a one-off
  // CLI script because `payload run` currently can't load this config file
  // outside Next's bundler in this dependency combination — see
  // scripts/seed.ts for the two upstream bugs.
  onInit: async (payload) => {
    await seed(payload)
  },
  editor: lexicalEditor(),
  collections: [Users, Media, Books, Categories, Series, Lessons, Articles, Pages, Announcements, Events, Carts, Orders, PaymentEvents, MockPaymentSessions],
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
