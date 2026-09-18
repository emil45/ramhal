import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

/**
 * Prefixed locales only — Hebrew is the default and carries no URL prefix
 * (docs/DECISIONS.md §2). Adding a fourth locale means adding it here; no
 * other routing change is required.
 */
const PREFIXED_LOCALES = ['en', 'fr']

function isDevApiPath(pathname: string): boolean {
  return /^\/api\/dev-/.test(pathname)
}

function hasLocalePrefix(pathname: string): boolean {
  return PREFIXED_LOCALES.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))
}

/**
 * Two unrelated jobs, kept in one function because Next only supports one
 * proxy file per project (see node_modules/next/dist/docs/.../proxy.md).
 *
 * 1. Every /api/dev-* route (dev-migrate, dev-import, dev-generate-types —
 *    a privileged one-off Payload Local API operation, run through Next's
 *    bundler because the CLI can't load this project's config) is
 *    unreachable in production, before its route handler ever runs. Each
 *    handler has its own independent check for the same thing — see the
 *    security note at the top of src/app/(payload)/api/dev-migrate/route.ts
 *    for why both layers exist.
 *
 * 2. Hebrew-at-the-root locale routing: app/(frontend)/[locale] handles
 *    every locale uniformly, including Hebrew, so an unprefixed request is
 *    rewritten onto /he/... — invisibly to the visitor, who never sees a
 *    /he in the URL.
 */
export function proxy(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl

  if (isDevApiPath(pathname)) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(null, { status: 404 })
    }
    return undefined
  }

  if (!hasLocalePrefix(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = `/he${pathname}`
    return NextResponse.rewrite(url)
  }

  return undefined
}

export const config = {
  matcher: ['/api/dev-(.*)', '/((?!admin|api|_next|favicon.ico|media/|.*\\..*).*)'],
}
