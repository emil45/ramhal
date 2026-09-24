import type { Locale } from './locale.ts'

/**
 * The three domains of the legacy website, each the site of one language. The
 * key is the host without `www.`; the value is the locale that site's visitors
 * are sent to.
 */
export const LEGACY_HOST_LOCALES = {
  'ramhal.com': 'he',
  'enramhal.com': 'en',
  'frramhal.com': 'fr',
} as const satisfies Record<string, Locale>

export type LegacyHost = keyof typeof LEGACY_HOST_LOCALES

/** Legacy host → normalized legacy path → current path. */
export type LegacyRedirectTable = Record<LegacyHost, Record<string, string>>

function isLegacyHost(name: string): name is LegacyHost {
  return Object.hasOwn(LEGACY_HOST_LOCALES, name)
}

/** The legacy host a request's `Host` header names, or null for any other host. */
export function legacyHostOf(hostHeader: string | null): LegacyHost | null {
  if (!hostHeader) return null
  const name = hostHeader.toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '')
  return isLegacyHost(name) ? name : null
}

/**
 * The one form every spelling of a legacy path is compared in: percent-decoded
 * (the old site encoded even hyphens as %2D), composed Unicode, lower case (its
 * server ignored case), no repeated or trailing slashes. Query strings never
 * reach this function; they are ignored by design. Null when the path is not
 * valid percent-encoding, which no legacy URL ever was.
 */
export function normalizeLegacyPath(pathname: string): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    // Visitor-supplied input: a malformed escape cannot be a legacy URL.
    return null
  }
  const normalized = decoded.normalize('NFC').toLowerCase().replace(/\/{2,}/g, '/').replace(/\/$/, '')
  return normalized === '' ? '/' : normalized
}

/** Where a request for `pathname` on `host` should be permanently sent, if anywhere. */
export function findLegacyRedirect(table: LegacyRedirectTable, host: string | null, pathname: string): string | null {
  const legacyHost = legacyHostOf(host)
  if (!legacyHost) return null
  const path = normalizeLegacyPath(pathname)
  if (path === null) return null
  return Object.hasOwn(table[legacyHost], path) ? table[legacyHost][path] : null
}
