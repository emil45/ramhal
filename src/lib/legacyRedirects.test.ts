import { describe, expect, it } from 'vitest'

import legacyRedirects from '@/lib/legacyRedirects.json'
import { findLegacyRedirect, isLegacyHost, normalizeLegacyPath } from '@/lib/legacyRedirects'
import { BOOK_SEGMENT, CATALOGUE_SEGMENT } from '@/lib/routes'

// What this site serves at the root (Hebrew): home, catalogue, book, the narrative pages.
function isCurrentRoute(target: string): boolean {
  if (/^\/(en|fr)(\/|$)/.test(target)) return false
  if (target === '/') return true
  const fixedPages = ['/ramhal', '/rabbi-chriqui', '/beit-ramhal', '/donate', '/courses', `/${CATALOGUE_SEGMENT.he}`]
  if (fixedPages.includes(target)) return true
  const [, segment, slug, ...more] = target.split('/')
  return segment === BOOK_SEGMENT.he && Boolean(slug) && more.length === 0
}

describe('normalizeLegacyPath', () => {
  const canonical = '/ספר-חדש/דברות-רמחל.html'

  it.each([
    ['percent-encoded Hebrew', '/%D7%A1%D7%A4%D7%A8-%D7%97%D7%93%D7%A9/%D7%93%D7%91%D7%A8%D7%95%D7%AA-%D7%A8%D7%9E%D7%97%D7%9C.html'],
    ['encoded hyphens, as the old site wrote them', '/ספר%2Dחדש/דברות%2Dרמחל.html'],
    ['a trailing slash', `${canonical}/`],
    ['repeated slashes', '//ספר-חדש//דברות-רמחל.html'],
    ['decomposed Unicode', canonical.normalize('NFD')],
  ])('treats %s as the same path', (_description, variant) => {
    expect(normalizeLegacyPath(variant)).toBe(canonical)
  })

  it('ignores letter case, which the old server did', () => {
    expect(normalizeLegacyPath('/Books-In-Hebrew.HTML')).toBe('/books-in-hebrew.html')
  })

  it('keeps the root as a single slash', () => {
    expect(normalizeLegacyPath('/')).toBe('/')
    expect(normalizeLegacyPath('')).toBe('/')
  })

  it('has no path for invalid percent-encoding', () => {
    expect(normalizeLegacyPath('/%E0%A4%A')).toBeNull()
  })
})

describe('isLegacyHost', () => {
  it.each(['ramhal.com', 'www.ramhal.com', 'WWW.Ramhal.com:443'])('recognises %s', (host) => {
    expect(isLegacyHost(host)).toBe(true)
  })

  it.each([
    null,
    '',
    'localhost:3000',
    'ramhal-theta.vercel.app',
    'notramhal.com',
    'ramhal.com.example.org',
    'enramhal.com',
    'www.frramhal.com',
  ])('ignores %s', (host) => {
    expect(isLegacyHost(host)).toBe(false)
  })
})

describe('the committed redirect table', () => {
  it('sends every source to a route this site serves, in Hebrew', () => {
    for (const [source, target] of Object.entries(legacyRedirects)) {
      expect(isCurrentRoute(target), `${source} → ${target}`).toBe(true)
    }
  })

  it('lists sources only in normalized form, so each has one spelling', () => {
    for (const source of Object.keys(legacyRedirects)) {
      expect(normalizeLegacyPath(source), source).toBe(source)
    }
  })

  it('has no redirect to itself or to another redirect', () => {
    for (const [source, target] of Object.entries(legacyRedirects)) {
      expect(target, source).not.toBe(source)
      expect(Object.hasOwn(legacyRedirects, normalizeLegacyPath(target) ?? target), `${source} → ${target} is a chain`).toBe(false)
    }
  })

  it('resolves every spelling of a source to the same target', () => {
    for (const [source, target] of Object.entries(legacyRedirects)) {
      const spellings = [source, encodeURI(source), `${encodeURI(source)}/`, encodeURI(source).replaceAll('-', '%2D'), source.toUpperCase()]
      for (const spelling of spellings) {
        expect(findLegacyRedirect(legacyRedirects, 'www.ramhal.com', spelling), spelling).toBe(target)
      }
    }
  })

  it('does not redirect the pages of the retired domains, the current host or a path it does not list', () => {
    const [[source]] = Object.entries(legacyRedirects)
    expect(findLegacyRedirect(legacyRedirects, 'ramhal-theta.vercel.app', source)).toBeNull()
    expect(findLegacyRedirect(legacyRedirects, 'www.frramhal.com', source)).toBeNull()
    expect(findLegacyRedirect(legacyRedirects, 'enramhal.com', source)).toBeNull()
    expect(findLegacyRedirect(legacyRedirects, 'www.ramhal.com', '/vayera.html')).toBeNull()
  })

  it.each(['/mp3', '/מכון-רמח-ל', '/צור-קשר', '/CD-DVD.html'])('leaves the dropped page %s to 404', (path) => {
    expect(findLegacyRedirect(legacyRedirects, 'www.ramhal.com', path)).toBeNull()
  })
})
