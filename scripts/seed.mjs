#!/usr/bin/env node
// Initialises the few records a new Ramhal database needs. This intentionally
// builds the smallest Payload config that can run src/seed.ts: loading the full
// application config outside Next currently hits the Payload/Next CLI bugs
// recorded in docs/DECISIONS.md §15, while seeding from the application's
// onInit hook would repeat on every cold Vercel function instance.
import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig, getPayload } from 'payload'

import { Categories } from '../src/collections/Categories.ts'
import { Media } from '../src/collections/Media.ts'
import { Schedule } from '../src/globals/Schedule.ts'
import { ShippingSettings } from '../src/globals/ShippingSettings.ts'
import { SiteSettings } from '../src/globals/SiteSettings.ts'
import { seed } from '../src/seed.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // Vercel and CI provide variables through the process environment.
}

const connectionString = process.env.DATABASE_URI
if (!connectionString) {
  throw new Error('DATABASE_URI is not set. See .env.example.')
}

const payload = await getPayload({
  config: buildConfig({
    secret: process.env.PAYLOAD_SECRET ?? 'seed-runner',
    collections: [Categories, Media],
    globals: [Schedule, ShippingSettings, SiteSettings],
    localization: {
      locales: [
        { code: 'he', label: 'עברית', rtl: true },
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français' },
      ],
      defaultLocale: 'he',
      fallback: false,
    },
    db: postgresAdapter({ pool: { connectionString }, push: false }),
  }),
})

try {
  await seed(payload)
  payload.logger.info('Seed complete.')
} finally {
  await payload.destroy()
}

// Payload's Postgres adapter retains a reconnect client. Its own CLI exits
// explicitly after destroy for the same reason.
process.exit(0)
