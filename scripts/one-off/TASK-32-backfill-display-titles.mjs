#!/usr/bin/env vite-node
// One-time backfill for TASK-32's `displayTitle`/`displayTitleLocale`
// (src/collections/fields/localizedDisplayTitleFields.ts). Those columns are
// computed by a beforeChange hook (src/collections/hooks/displayTitle.ts) on
// every future save, but every document that already existed before this
// task's migration (20260922_190439_TASK_32_admin_facelift.ts) added the
// columns has never been saved since, so it starts out NULL — which would
// leave the entire admin catalogue showing blank titles until someone
// happens to open and re-save each row by hand. This resaves every document
// in the seven affected collections once, with an empty `data`, purely to
// run that hook. It changes no editorial content.
//
// Run once per database that already had rows before the migration —
// verified against the `development` Neon branch while building this task;
// must also be run against production after this task's migration is
// applied there (see docs/reports/TASK-32.md).

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config.ts')

const COLLECTIONS_WITH_DISPLAY_TITLE = ['books', 'categories', 'series', 'articles', 'pages', 'announcements', 'events']

const payload = await getPayload({ config })

try {
  for (const collection of COLLECTIONS_WITH_DISPLAY_TITLE) {
    const { docs } = await payload.find({ collection, depth: 0, limit: 0, pagination: false, overrideAccess: true })
    let updated = 0
    for (const doc of docs) {
      await payload.update({ collection, id: doc.id, data: {}, overrideAccess: true })
      updated += 1
    }
    console.log(`${collection}: backfilled ${updated} document(s)`)
  }
} finally {
  await payload.destroy()
}

process.exit(0)
