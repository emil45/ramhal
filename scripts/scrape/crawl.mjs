#!/usr/bin/env node
// Phase 1 of 2: fetch pages and cache them on disk. No parsing happens here.
//
// Crawling and parsing are separate on purpose. These sites ask for a 5-second
// crawl delay and the French host throws 429s, so a full pass takes ~40 minutes.
// We pay that once. Everything after that reads from .cache/ and can be rerun
// as often as we like while the extraction rules are still being worked out.
//
// Usage:
//   node crawl.mjs --mode=sample                 ~15 awkward pages, a few minutes
//   node crawl.mjs --mode=full                   every URL in all three sitemaps
//   node crawl.mjs --mode=full --site=fr         one site only
//   node crawl.mjs --mode=full --limit=25        stop after N (useful for a trial run)
//
// Safe to interrupt and rerun — anything already cached is skipped.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchCached } from './lib/http.mjs';
import { SITES, SAMPLE_EXPLICIT, SAMPLE_HE_MATCHES } from './seeds.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const MODE = args.mode ?? 'sample';
const ONLY_SITE = args.site ?? null;
const LIMIT = args.limit ? Number(args.limit) : Infinity;
const CACHE_ROOT = join(process.cwd(), '.cache');

/** Pull every <loc> out of the .asp sitemap. */
function extractSitemapUrls(xml) {
  const urls = new Set();
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) urls.add(m[1].trim());
  // Some responses come back as an HTML list rather than XML.
  if (urls.size === 0) {
    for (const m of xml.matchAll(/href=["']([^"']+\.(?:html|asp)[^"']*)["']/gi)) {
      urls.add(m[1].trim());
    }
  }
  return [...urls];
}

function absolutise(origin, href) {
  if (/^https?:\/\//i.test(href)) return href;
  // Deliberately string concatenation, not new URL(...).  %2D survives either
  // way, but keeping it textual makes it obvious that nothing re-encodes here.
  return origin + (href.startsWith('/') ? href : '/' + href);
}

async function urlsForSite(siteKey, site, cacheDir) {
  if (MODE === 'sample') {
    const explicit = (SAMPLE_EXPLICIT[siteKey] ?? []).map((p) => absolutise(site.origin, p));
    if (siteKey !== 'he') return explicit;

    // Hebrew: discover from the sitemap, then choose by decoded slug.
    // We decode only to *decide*; the URL we request is always the raw one.
    console.log(`  fetching sitemap to choose Hebrew sample pages…`);
    const sm = await fetchCached(site.sitemap, cacheDir);
    const all = extractSitemapUrls(sm.body).map((u) => absolutise(site.origin, u));
    const picked = [];
    for (const term of SAMPLE_HE_MATCHES) {
      const hit = all.find((u) => {
        let decoded;
        try {
          decoded = decodeURIComponent(u);
        } catch {
          return false;
        }
        return decoded.includes(term) && !picked.includes(u);
      });
      if (hit) picked.push(hit);
      else console.warn(`  no sitemap match for "${term}"`);
    }
    return [...explicit, ...picked];
  }

  console.log(`  fetching sitemap…`);
  const sm = await fetchCached(site.sitemap, cacheDir);
  const urls = extractSitemapUrls(sm.body).map((u) => absolutise(site.origin, u));
  console.log(`  sitemap lists ${urls.length} URLs`);
  return urls;
}

async function run() {
  const chosen = ONLY_SITE ? { [ONLY_SITE]: SITES[ONLY_SITE] } : SITES;
  if (ONLY_SITE && !SITES[ONLY_SITE]) {
    console.error(`Unknown site "${ONLY_SITE}". Expected one of: ${Object.keys(SITES).join(', ')}`);
    process.exit(1);
  }

  const summary = {};

  for (const [key, site] of Object.entries(chosen)) {
    console.log(`\n=== ${site.label} — mode=${MODE} ===`);
    const cacheDir = join(CACHE_ROOT, key);
    await mkdir(cacheDir, { recursive: true });

    const urls = (await urlsForSite(key, site, cacheDir)).slice(0, LIMIT);
    console.log(`  ${urls.length} URLs to fetch\n`);

    let fetched = 0, cached = 0, failed = 0;
    const failures = [];

    for (const [i, url] of urls.entries()) {
      const res = await fetchCached(url, cacheDir);
      if (res.error || res.status === 0) {
        failed++;
        failures.push({ url, error: res.error });
        console.log(`  [${i + 1}/${urls.length}] FAIL  ${decodeSafe(url)}  (${res.error})`);
      } else if (res.fromCache) {
        cached++;
      } else {
        fetched++;
        const eta = Math.round(((urls.length - i - 1) * 5.5) / 60);
        console.log(`  [${i + 1}/${urls.length}] ok ${String(res.body.length).padStart(7)}b  ~${eta}m left  ${decodeSafe(url)}`);
      }
    }

    summary[key] = { total: urls.length, fetched, alreadyCached: cached, failed, failures };
    console.log(`\n  ${site.label}: ${fetched} fetched, ${cached} already cached, ${failed} failed`);
  }

  await writeFile(join(CACHE_ROOT, 'crawl-summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\nDone. Cache in .cache/  ·  summary in .cache/crawl-summary.json`);
  console.log(`Next: node parse.mjs`);
}

function decodeSafe(u) {
  try {
    return decodeURIComponent(u);
  } catch {
    return u;
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
