import config from '@payload-config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { importBooks, type Reconciliation } from '@/importBooks'
import { isDevRouteAuthorized } from '@/lib/devRouteAuth'

/**
 * Dev-only route that runs the book catalogue import through Payload's
 * Local API, from inside a process Next already bundles correctly — same
 * reason and same two-layer guard as
 * src/app/(payload)/api/dev-migrate/route.ts (read the security note
 * there; it applies here unchanged, including the DEV_MIGRATE_SECRET name
 * reused below rather than inventing a second one).
 *
 * Delete this route and scripts/import-books.mjs once the catalogue import
 * is done and verified — it is not meant to be permanent infrastructure.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isDevRouteAuthorized(request)) {
    return NextResponse.json(null, { status: 404 })
  }

  const reconciliationPath = path.resolve(process.cwd(), 'scripts/scrape/out/reconciliation.json')
  const reconciliation: Reconciliation = JSON.parse(await readFile(reconciliationPath, 'utf8'))

  const payload = await getPayload({ config })
  const summary = await importBooks(payload, reconciliation)

  return NextResponse.json({ ok: true, summary })
}
