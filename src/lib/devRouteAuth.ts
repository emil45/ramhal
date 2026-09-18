import { timingSafeEqual } from 'node:crypto'

/**
 * Shared gate for every /api/dev-* route (dev-migrate, dev-import,
 * dev-generate-types): a privileged one-off Payload Local API operation, run
 * through Next's bundler because the CLI can't load this project's config
 * (see the security note at the top of src/app/(payload)/api/dev-migrate/route.ts,
 * which applies unchanged to every route using this).
 */
export function isDevRouteAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== 'development') return false

  const expected = process.env.DEV_MIGRATE_SECRET
  if (!expected) return false

  const provided = request.headers.get('x-dev-migrate-secret') ?? ''
  const expectedBytes = Buffer.from(expected)
  const providedBytes = Buffer.from(provided)
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes)
}
