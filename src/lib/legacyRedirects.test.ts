import { describe, expect, it } from 'vitest'

import legacyRedirects from '@/lib/legacyRedirects.json'
import { findLegacyRedirect, LEGACY_HOST_LOCALES, legacyHostOf, normalizeLegacyPath } from '@/lib/legacyRedirects'
import { BOOK_SEGMENT, CATALOGUE_SEGMENT } from '@/lib/routes'

import type { LegacyHost } from '@/lib/legacyRedirects'
import type { Locale } from '@/lib/locale'

const HOSTS: LegacyHost[] = ['ramhal.com', 'enramhal.com', 'frramhal.com']

// What this site serves, per locale prefix: home, catalogue, book, the narrative pages.
function isCurrentRoute(locale: Locale, target: string): boolean {
  const prefix = locale === 'he' ? '' : `/${locale}`
  const rest = target.startsWith(prefix) ? target.slice(prefix.length) : null
  if (rest === null || (locale === 'he' && /^\/(en|fr)(\/|$)/.test(target))) return false
  if (rest === '' || rest === '/') return true
  const fixedPages = ['/ramhal', '/rabbi-chriqui', '/beit-ramhal', '/donate', '/courses', `/${CATALOGUE_SEGMENT[locale]}`]
  if (fixedPages.includes(rest)) return true
  const [, segment, slug, ...more] = rest.split('/')
  return segment === BOOK_SEGMENT[locale] && Boolean(slug) && more.length === 0
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

describe('legacyHostOf', () => {
  it.each(['ramhal.com', 'www.ramhal.com', 'WWW.Ramhal.com:443', 'enramhal.com', 'www.frramhal.com'])('recognises %s', (host) => {
    expect(legacyHostOf(host)).not.toBeNull()
  })

  it.each([null, '', 'localhost:3000', 'ramhal-theta.vercel.app', 'notramhal.com', 'ramhal.com.example.org'])(
    'ignores %s',
    (host) => {
      expect(legacyHostOf(host)).toBeNull()
    },
  )
})

describe('the committed redirect table', () => {
  it.each(HOSTS)('sends every %s source to a route this site serves, in that site\'s language', (host) => {
    for (const [source, target] of Object.entries(legacyRedirects[host])) {
      expect(isCurrentRoute(LEGACY_HOST_LOCALES[host], target), `${host}${source} → ${target}`).toBe(true)
    }
  })

  it.each(HOSTS)('lists %s sources only in normalized form, so each has one spelling', (host) => {
    for (const source of Object.keys(legacyRedirects[host])) {
      expect(normalizeLegacyPath(source), source).toBe(source)
    }
  })

  it.each(HOSTS)('has no %s redirect to itself or to another redirect', (host) => {
    const table: Record<string, string> = legacyRedirects[host]
    for (const [source, target] of Object.entries(table)) {
      expect(target, source).not.toBe(source)
      expect(Object.hasOwn(table, normalizeLegacyPath(target) ?? target), `${source} → ${target} is a chain`).toBe(false)
    }
  })

  it('resolves every spelling of a source to the same target', () => {
    for (const host of HOSTS) {
      for (const [source, target] of Object.entries(legacyRedirects[host])) {
        const spellings = [source, encodeURI(source), `${encodeURI(source)}/`, encodeURI(source).replaceAll('-', '%2D'), source.toUpperCase()]
        for (const spelling of spellings) {
          expect(findLegacyRedirect(legacyRedirects, `www.${host}`, spelling), `${host}${spelling}`).toBe(target)
        }
      }
    }
  })

  it('does not redirect on the current host or on a path it does not list', () => {
    const [[source]] = Object.entries(legacyRedirects['frramhal.com'])
    expect(findLegacyRedirect(legacyRedirects, 'ramhal-theta.vercel.app', source)).toBeNull()
    expect(findLegacyRedirect(legacyRedirects, 'www.frramhal.com', '/vayera.html')).toBeNull()
  })
})
