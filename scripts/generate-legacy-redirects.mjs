#!/usr/bin/env node
// Builds src/lib/legacyRedirects.json — where each URL of the three legacy sites
// (ramhal.com, enramhal.com, frramhal.com) goes on this site — from:
//   - the crawl of the legacy sites (scripts/scrape/out/{he,en,fr}.json),
//   - Books.legacyUrls in the database DATABASE_URI names (book targets are the
//     book's current urlSlug),
//   - the hand-written table of non-book equivalents (scripts/legacy-redirects/).
// Output is sorted, so a diff shows exactly which redirects changed. Run it after a
// slug change or a catalogue import (README, "Legacy URLs"). It refuses duplicate
// sources, a legacy URL claimed by two books, hand-table paths that were never
// crawled, targets that would loop or chain, and any legacy URL on an unknown host.
//
// Run through vite-node (npm run redirects:generate) for the same reason as
// import:books: the full Payload config cannot be loaded by plain Node.
import { readFile, writeFile } from 'node:fs/promises'

import { getPayload } from 'payload'

import { LEGACY_HOST_LOCALES, normalizeLegacyPath } from '../src/lib/legacyRedirects.ts'
import { bookPath, cataloguePath, coursesPath, donatePath, localePath } from '../src/lib/routes.ts'
import config from '../src/payload.config.ts'
import { PAGE_EQUIVALENCES } from './legacy-redirects/pageEquivalences.mjs'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

const OUTPUT_FILE = new URL('../src/lib/legacyRedirects.json', import.meta.url)
const SITES = { he: 'ramhal.com', en: 'enramhal.com', fr: 'frramhal.com' }

// Not pages of the crawl, but URLs the crawled pages link to or the scraper paginates:
// the site's own home address (`/site/index.asp`, `/?depart_id=…&lat=…`) and the
// category listing's pagination endpoint (scripts/scrape/seeds.mjs, PAGINATION).
const HOME_ALIASES = ['/site/index.asp']
const CATEGORY_LISTING_ALIASES = ['/site/detail/detail/detaildetail.asp']

const PAGE_TARGETS = {
  catalogue: cataloguePath,
  ramhal: (locale) => localePath(locale, '/ramhal'),
  beitRamhal: (locale) => localePath(locale, '/beit-ramhal'),
  rabbiChriqui: (locale) => localePath(locale, '/rabbi-chriqui'),
  donate: donatePath,
  courses: coursesPath,
}

function fail(message) {
  throw new Error(`redirects:generate: ${message}`)
}

function normalized(pathname, origin) {
  const path = normalizeLegacyPath(pathname)
  if (path === null) fail(`${origin}: not valid percent-encoding: ${pathname}`)
  return path
}

function hostAndPath(url) {
  const { hostname, pathname } = new URL(url)
  const host = hostname.replace(/^www\./, '')
  if (!Object.hasOwn(LEGACY_HOST_LOCALES, host)) fail(`unknown legacy host "${hostname}" in ${url}`)
  return { host, path: normalized(pathname, url) }
}

async function readCrawl(site) {
  const { pages } = JSON.parse(await readFile(new URL(`../scripts/scrape/out/${site}.json`, import.meta.url), 'utf8'))
  const byPath = new Map()
  for (const page of pages) byPath.set(hostAndPath(page.url).path, page)
  return byPath
}

async function readBookLegacyUrls() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'books',
    depth: 0,
    pagination: false,
    select: { urlSlug: true, legacyUrls: true },
  })
  await payload.destroy()
  return docs
}

const redirects = { 'ramhal.com': {}, 'enramhal.com': {}, 'frramhal.com': {} }
const origins = new Map()

function addRedirect(host, path, target, origin) {
  const key = `${host}${path}`
  if (origins.has(key)) fail(`${key} is claimed twice: by ${origins.get(key)} and by ${origin}`)
  if (path === target) fail(`${key} would redirect to itself (${origin})`)
  origins.set(key, origin)
  redirects[host][path] = target
}

const crawls = { he: await readCrawl('he'), en: await readCrawl('en'), fr: await readCrawl('fr') }
const books = await readBookLegacyUrls()

const bookSources = new Set()
for (const book of books) {
  for (const { url } of book.legacyUrls ?? []) {
    const { host, path } = hostAndPath(url)
    const locale = LEGACY_HOST_LOCALES[host]
    addRedirect(host, path, bookPath(locale, book.urlSlug), `book ${book.urlSlug}`)
    bookSources.add(`${host}${path}`)
  }
}

const slugs = new Set(books.map((book) => book.urlSlug))
const pageSources = new Set()
for (const [site, equivalences] of Object.entries(PAGE_EQUIVALENCES)) {
  const host = SITES[site]
  const locale = LEGACY_HOST_LOCALES[host]
  const claim = (rawPath, target, origin) => {
    const path = normalized(rawPath, origin)
    if (!crawls[site].has(path)) fail(`${origin}: ${rawPath} is not in the ${site} crawl`)
    addRedirect(host, path, target, origin)
    pageSources.add(`${host}${path}`)
  }
  for (const [name, buildTarget] of Object.entries(PAGE_TARGETS)) {
    for (const rawPath of equivalences[name]) claim(rawPath, buildTarget(locale), `${site} ${name}`)
  }
  for (const [rawPath, slug] of Object.entries(equivalences.books)) {
    if (!slugs.has(slug)) fail(`${site} ${rawPath}: no book has urlSlug "${slug}"`)
    claim(rawPath, bookPath(locale, slug), `${site} book ${slug}`)
  }
}

// The Hebrew site's own root is the current home page; the other two need a hop.
for (const site of ['en', 'fr']) addRedirect(SITES[site], '/', localePath(site, '/'), `${site} home`)
for (const [site, host] of Object.entries(SITES)) {
  const locale = LEGACY_HOST_LOCALES[host]
  for (const path of HOME_ALIASES) addRedirect(host, path, localePath(locale, '/'), `${site} home alias`)
  for (const path of CATEGORY_LISTING_ALIASES) addRedirect(host, path, cataloguePath(locale), `${site} listing alias`)
}

for (const [host, table] of Object.entries(redirects)) {
  for (const [path, target] of Object.entries(table)) {
    const targetPath = normalized(target, `${host}${path}`)
    if (Object.hasOwn(table, targetPath)) fail(`${host}${path} redirects to ${target}, which is itself redirected`)
  }
}

const sorted = Object.fromEntries(
  Object.entries(redirects).map(([host, table]) => [
    host,
    Object.fromEntries(Object.entries(table).sort(([first], [second]) => (first < second ? -1 : first > second ? 1 : 0))),
  ]),
)
await writeFile(OUTPUT_FILE, `${JSON.stringify(sorted, null, 2)}\n`)

console.log('Coverage of the crawled legacy pages:')
const deliberateNotFound = []
for (const [site, host] of Object.entries(SITES)) {
  let toBook = 0
  let toPage = 0
  let homeServed = 0
  for (const [path, page] of crawls[site]) {
    const key = `${host}${path}`
    if (bookSources.has(key)) toBook += 1
    else if (pageSources.has(key)) toPage += 1
    else if (site === 'he' && path === '/') homeServed += 1
    else if (site !== 'he' && path === '/') toPage += 1
    else {
      const section = Array.isArray(page.breadcrumb) && page.breadcrumb.every((part) => part.length < 80)
        ? (page.breadcrumb[1] ?? page.breadcrumb[0] ?? '(no breadcrumb)')
        : '(no breadcrumb)'
      deliberateNotFound.push({ site, type: page.type, section, path, words: page.wordCount })
    }
  }
  const notFound = deliberateNotFound.filter((entry) => entry.site === site).length
  console.log(`  ${site} (${host}): ${crawls[site].size} pages — to a book ${toBook}, to a page ${toPage}, served as home ${homeServed}, deliberate 404 ${notFound}`)
}
console.log(`Redirects written: ${Object.entries(sorted).map(([host, table]) => `${host} ${Object.keys(table).length}`).join(', ')}`)
console.log('\nDeliberate 404s:')
for (const entry of deliberateNotFound) console.log(`${entry.site}\t${entry.type}\t${entry.section}\t${entry.path}\t${entry.words}`)
process.exit(0)
