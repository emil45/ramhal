import { NextResponse } from 'next/server'

/**
 * Only job: make sure every /api/dev-* route (dev-migrate, dev-import, and
 * any future one of the same shape — a privileged one-off Payload local-API
 * operation, run through Next's bundler because the CLI can't load this
 * project's config) is unreachable in production, before its route handler
 * ever runs. Each of those handlers has its own independent check for the
 * same thing — see the security note at the top of
 * src/app/(payload)/api/dev-migrate/route.ts for why both layers exist. The
 * `matcher` below already restricts this to exactly those paths, so there is
 * no request to inspect here.
 */
export function proxy(): NextResponse | undefined {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(null, { status: 404 })
  }
  return undefined
}

export const config = {
  matcher: '/api/dev-(.*)',
}
