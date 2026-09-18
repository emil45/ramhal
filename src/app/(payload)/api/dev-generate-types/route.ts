import config from '@payload-config'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { isDevRouteAuthorized } from '@/lib/devRouteAuth'

import type { SanitizedConfig } from 'payload'

/**
 * Dev-only route that writes src/payload-types.ts — same reason and same
 * two-layer guard as src/app/(payload)/api/dev-migrate/route.ts (read the
 * security note there; it applies here unchanged).
 *
 * `payload generate:types` hits the identical `ERR_REQUIRE_ASYNC_MODULE`
 * loader bug as `migrate` (verified: same crash, same stack, requiring this
 * project's payload.config.ts). Its generator function
 * (`payload/dist/bin/generateTypes.js`) is not part of Payload's public
 * package exports, so it can't be imported by its package specifier —
 * Node's module resolver enforces the "exports" map for bare specifiers.
 * Importing it by its resolved absolute file:// URL instead is not subject
 * to that restriction (verified against plain Node), and is the same trick
 * Payload's own CLI uses internally for its `run` subcommand
 * (payload/dist/bin/index.js's `import(pathToFileURL(scriptPath)...)`).
 *
 * A second, independent obstacle: Turbopack statically analyzes `import()`
 * calls to bundle their target ahead of time, and refuses one whose
 * argument it can't resolve at build time ("Cannot find module as
 * expression is too dynamic"). Routing the call through `new Function` — a
 * string Turbopack does not trace into — keeps it a genuine runtime-only
 * import, exactly like the createMigration/migrate calls in
 * dev-migrate/route.ts already run inside a bundle Turbopack built
 * correctly.
 *
 * Delete this route once payloadcms/payload fixes the underlying loader bug
 * (see docs/DECISIONS.md §15) or exports generateTypes publicly.
 */

type GenerateTypesModule = {
  generateTypes: (config: SanitizedConfig, options?: { log?: boolean }) => Promise<void>
}

const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<GenerateTypesModule>

export async function GET(request: Request): Promise<Response> {
  if (!isDevRouteAuthorized(request)) {
    return NextResponse.json(null, { status: 404 })
  }

  // No DB connection needed — this only compiles the sanitized config into
  // TypeScript. disableOnInit for the same reason as the migrate route: no
  // point seeding a database this route never touches.
  const payload = await getPayload({ config, disableDBConnect: true, disableOnInit: true })

  const generateTypesPath = path.resolve(process.cwd(), 'node_modules/payload/dist/bin/generateTypes.js')
  const { generateTypes } = await dynamicImport(pathToFileURL(generateTypesPath).href)

  await generateTypes(payload.config, { log: false })

  return NextResponse.json({ ok: true, outputFile: payload.config.typescript.outputFile })
}
