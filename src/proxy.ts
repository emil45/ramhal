import { NextResponse } from 'next/server'

/**
 * Only job: make sure /api/dev-migrate is unreachable in production, before
 * its route handler ever runs. That handler has its own independent check
 * for the same thing — see the security note at the top of
 * src/app/(payload)/api/dev-migrate/route.ts for why both exist. The
 * `matcher` below already restricts this to exactly that path, so there is
 * no request to inspect here.
 */
export function proxy(): NextResponse | undefined {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(null, { status: 404 })
  }
  return undefined
}

export const config = {
  matcher: '/api/dev-migrate',
}
