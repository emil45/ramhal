import { NextResponse } from 'next/server'

import legacyRedirects from '@/lib/legacyRedirects.json'
import { DEFAULT_LOCALE } from '@/lib/locale'
import { findLegacyRedirect, LEGACY_HOST_LOCALES, legacyHostOf } from '@/lib/legacyRedirects'

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
 * Three unrelated jobs, kept in one function because Next only supports one
 * proxy file per project (see node_modules/next/dist/docs/.../proxy.md).
 *
 * 1. Every /api/dev-* route (dev-migrate and dev-generate-types —
 *    a privileged one-off Payload Local API operation, run through Next's
 *    bundler because the CLI can't load this project's config) is
 *    unreachable in production, before its route handler ever runs. Each
 *    handler has its own independent check for the same thing — see the
 *    security note at the top of src/app/(payload)/api/dev-migrate/route.ts
 *    for why both layers exist.
 *
 * 2. A request on one of the legacy domains for a page of the old site goes
 *    permanently to its equivalent here, when there is one
 *    (src/lib/legacyRedirects.json, docs/DECISIONS.md §18). A legacy URL with
 *    no equivalent falls through and 404s.
 *
 * 3. Hebrew-at-the-root locale routing: app/(frontend)/[locale] handles
 *    every locale uniformly, including Hebrew, so an unprefixed request is
 *    rewritten onto /he/... — invisibly to the visitor, who never sees a
 *    /he in the URL. On a legacy domain "unprefixed" means that site's own
 *    language, so a dead French URL shows the French 404.
 */
export function proxy(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl

  if (isDevApiPath(pathname)) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(null, { status: 404 })
    }
    return undefined
  }

  const host = request.headers.get('host')
  const legacyTarget = findLegacyRedirect(legacyRedirects, host, pathname)
  if (legacyTarget) {
    const url = request.nextUrl.clone()
    url.pathname = legacyTarget
    url.search = ''
    return NextResponse.redirect(url, 301)
  }

  if (!hasLocalePrefix(pathname)) {
    const legacyHost = legacyHostOf(host)
    const url = request.nextUrl.clone()
    url.pathname = `/${legacyHost ? LEGACY_HOST_LOCALES[legacyHost] : DEFAULT_LOCALE}${pathname}`
    return NextResponse.rewrite(url)
  }

  return undefined
}

export const config = {
  // Paths with a file extension are static files and skip the proxy — except the
  // legacy sites' own page addresses, which all end in .html or .asp.
  matcher: ['/api/dev-(.*)', '/((?!admin|api|_next|favicon.ico|media/|.*\\.(?![hH][tT][mM][lL]$|[aA][sS][pP]$)).*)'],
}
