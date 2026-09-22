import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { he } from '@payloadcms/translations/languages/he'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { OAuth2Plugin } from 'payload-oauth2'
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
import { getGoogleUserInfo, readGoogleSignInConfig } from './lib/auth/googleSignIn.ts'
import { requireEnv } from './lib/env.ts'
import { getPublicMediaUrl, readMediaStorageSettings } from './lib/mediaStorage.ts'
import { readServerUrl } from './lib/serverUrl.ts'

const mediaStorage = readMediaStorageSettings(process.env)
const googleSignIn = readGoogleSignInConfig(process.env)
const serverUrl = readServerUrl()

export default buildConfig({
  admin: {
    user: Users.slug,
    // Custom admin components are referenced by path from here (src/), not
    // from the working directory Payload would otherwise assume.
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      // Only shown when Google sign-in is actually configured — an
      // unconfigured deployment (e.g. plain local dev) would otherwise show
      // a button that leads nowhere useful.
      beforeLogin: googleSignIn === null ? undefined : ['/components/admin/GoogleSignInLink#GoogleSignInLink'],
    },
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
    // Schema comes from the committed migrations (`npm run db:migrate`) and
    // from nowhere else. With Payload's default, `next dev` pushed the schema
    // straight into the database and recorded a batch -1 "dev" row in
    // payload_migrations; migrate then refused to run without an interactive
    // confirmation, so every fresh setup needed that row deleted by hand.
    // Two writers of one schema, so there is now exactly one.
    push: false,
  }),
  sharp,
  plugins: [
    s3Storage({
      enabled: mediaStorage !== null,
      // Adds the plugin's `prefix` column to `media` whether or not a bucket is
      // configured, so every environment has the same schema and one set of
      // migrations serves all of them.
      alwaysInsertFields: true,
      // Vercel functions accept request bodies only up to 4.5 MB. The admin
      // obtains a short-lived signed URL and sends the file straight to storage;
      // public reads likewise go straight to the bucket instead of consuming
      // a function invocation for every cover.
      clientUploads: mediaStorage !== null,
      collections: {
        media:
          mediaStorage === null
            ? true
            : {
                disablePayloadAccessControl: true,
                generateFileURL: ({ filename, prefix }) => getPublicMediaUrl(mediaStorage.publicUrl, prefix, filename),
              },
      },
      bucket: mediaStorage?.bucket ?? '',
      config: {
        endpoint: mediaStorage?.endpoint,
        region: mediaStorage?.region,
        forcePathStyle: true,
        credentials: { accessKeyId: mediaStorage?.accessKeyId ?? '', secretAccessKey: mediaStorage?.secretAccessKey ?? '' },
      },
    }),
    // Google sign-in for the admin panel — see docs/DECISIONS.md §19. The
    // package is a single-maintainer auth plugin pinned to an exact version
    // in package.json; an upgrade is a diff to read, not a number to bump.
    // disableLocalStrategy is deliberately never set: password login stays
    // as the break-glass path.
    OAuth2Plugin({
      enabled: googleSignIn !== null,
      strategyName: 'google',
      serverURL: serverUrl,
      clientId: googleSignIn?.clientId ?? '',
      clientSecret: googleSignIn?.clientSecret ?? '',
      providerAuthorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      scopes: ['openid', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
      useEmailAsIdentity: true,
      // The plugin's default ("create") would create a user row — with
      // Users.role defaulting to "editor" — for any Google account that
      // completes the flow. Every admin is provisioned by hand instead.
      onUserNotFoundBehavior: 'error',
      // The authorize endpoint never generates or verifies `state` on its
      // own; this is what makes that step happen.
      pkceEnabled: true,
      // The son may be signed into more than one Google account.
      prompt: 'select_account',
      getUserInfo: getGoogleUserInfo,
      successRedirect: () => '/admin',
      // Never reflects the provider's error back to the browser.
      failureRedirect: () => '/admin',
    }),
  ],
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
