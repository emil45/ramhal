/** The one domain of the legacy website that still points at this app (docs/DECISIONS.md §18). */
export const LEGACY_HOST = 'ramhal.com'

/** Normalized legacy path → current path. */
export type LegacyRedirectTable = Record<string, string>

/** Whether a request's `Host` header names the legacy domain, with or without `www.` or a port. */
export function isLegacyHost(hostHeader: string | null): boolean {
  if (!hostHeader) return false
  return hostHeader.toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '') === LEGACY_HOST
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
  if (!isLegacyHost(host)) return null
  const path = normalizeLegacyPath(pathname)
  if (path === null) return null
  return Object.hasOwn(table, path) ? table[path] : null
}
