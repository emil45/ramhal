#!/usr/bin/env node
// Phase 2 of 2: turn cached HTML into JSON. Never touches the network.
//
// The hard part of these pages is that every one of them repeats the entire
// ~150-link global menu and footer, so the actual content is a small fraction
// of the markup and there are no useful semantic containers to select on.
//
// Rather than guess at CSS selectors for a 2010 ASP template, we detect the
// boilerplate empirically: any block of text that appears on most of the pages
// is chrome, and what is left is the content. This has a useful side effect —
// pages with nothing left after stripping are exactly the stub pages that
// render the homepage template, so they identify themselves.
//
// Usage: node parse.mjs [--site=he|fr|en] [--boilerplate=0.5]

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { SITES } from './seeds.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const ONLY_SITE = args.site ?? null;
// A block seen on more than this share of pages is treated as chrome.
const BOILERPLATE_THRESHOLD = args.boilerplate ? Number(args.boilerplate) : 0.5;

const CACHE_ROOT = join(process.cwd(), '.cache');
const OUT_ROOT = join(process.cwd(), 'out');

const decodeSafe = (u) => { try { return decodeURIComponent(u); } catch { return u; } };
// Currency before amount, or amount before currency — both occur on these pages.
const PRICE_RE = /[₪€$]\s?[\d,]+(?:\.\d{1,2})?|[\d,]+(?:\.\d{1,2})?\s?[₪€$]/;
const norm = (s) => s.replace(/\s+/g, ' ').trim();

/** Every text block on the page, in order, with its DOM path for debugging. */
function blocksOf($) {
  const out = [];
  $('body')
    .find('p, div, td, li, h1, h2, h3, h4, span')
    .each((_, el) => {
      const $el = $(el);
      // Only leaf-ish nodes, so we don't count a wrapper and its children twice.
      if ($el.children('p, div, td, li, h1, h2, h3, h4').length > 0) return;
      const text = norm($el.text());
      // Keep short blocks too when they carry a price — "₪80.00" is twelve
      // characters and is the single most important string on a product page.
      if (text.length >= 20 || PRICE_RE.test(text)) out.push(text);
    });
  return out;
}

function extractMedia($, html) {
  const youtube = new Set();
  // Embedded players, playlists, and bare links all appear on these pages.
  for (const m of html.matchAll(/youtube(?:-nocookie)?\.com\/embed\/videoseries\?list=([\w-]+)/gi)) {
    youtube.add({ type: 'playlist', id: m[1] });
  }
  for (const m of html.matchAll(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{6,})/gi)) {
    if (m[1] !== 'videoseries') youtube.add({ type: 'video', id: m[1] });
  }
  for (const m of html.matchAll(/youtu\.be\/([\w-]{6,})/gi)) youtube.add({ type: 'video', id: m[1] });

  const images = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !/spacer|pixel|blank|\.gif$/i.test(src)) {
      images.push({ src, alt: $(el).attr('alt') ?? null });
    }
  });

  const audio = [];
  for (const m of html.matchAll(/https?:\/\/[^\s"'<>]+\.mp3/gi)) audio.push(m[0]);

  return {
    youtube: [...new Map([...youtube].map((y) => [y.type + y.id, y])).values()],
    images,
    audio: [...new Set(audio)],
  };
}

/** Prices as displayed. Deliberately kept as strings plus a parsed number. */
function extractPrices(text) {
  const found = [];
  for (const m of text.matchAll(/([₪€$])\s?([\d,]+(?:\.\d{1,2})?)/g)) {
    const value = Number(m[2].replace(/,/g, ''));
    if (Number.isFinite(value)) found.push({ currency: m[1], raw: m[0], value });
  }
  for (const m of text.matchAll(/([\d,]+(?:\.\d{1,2})?)\s?([₪€$])/g)) {
    const value = Number(m[1].replace(/,/g, ''));
    if (Number.isFinite(value)) found.push({ currency: m[2], raw: m[0], value });
  }
  return found;
}

function classify({ title, content, prices, media, url }) {
  const words = content.split(/\s+/).filter(Boolean).length;
  // Check for a price FIRST. Product pages are legitimately short — treating
  // shortness as emptiness before looking for a price hides the whole catalogue.
  if (prices.some((p) => p.value > 0) && words < 400) return 'product';
  if (words < 25 && media.youtube.length === 0) return 'empty-or-stub';
  if (media.youtube.length >= 3 && words < 300) return 'media-index';
  if (words > 800) return 'long-article';
  if (/Category|Store|Livres|boutique|חנות/i.test(decodeSafe(url))) return 'store-category';
  return 'page';
}

async function parseSite(key, site) {
  const cacheDir = join(CACHE_ROOT, key);
  let indexLines;
  try {
    indexLines = (await readFile(join(cacheDir, 'index.jsonl'), 'utf8')).trim().split('\n');
  } catch {
    console.warn(`  no cache for "${key}" — run crawl.mjs first`);
    return null;
  }

  const entries = indexLines
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter((e) => e && e.status === 200 && !/sitemap\.asp/.test(e.url));

  // Deduplicate — a URL can appear more than once in the append-only index.
  const byKey = new Map(entries.map((e) => [e.key, e]));
  console.log(`  ${byKey.size} cached pages`);

  // Pass 1: read everything, count how often each text block occurs.
  const docs = [];
  const blockCounts = new Map();
  for (const entry of byKey.values()) {
    let html;
    try { html = await readFile(join(cacheDir, `${entry.key}.html`), 'utf8'); } catch { continue; }
    const $ = cheerio.load(html);
    $('script, style, noscript').remove();
    const blocks = blocksOf($);
    for (const b of new Set(blocks)) blockCounts.set(b, (blockCounts.get(b) ?? 0) + 1);
    docs.push({ entry, html, $, blocks });
  }

  const chromeCutoff = Math.max(2, Math.floor(docs.length * BOILERPLATE_THRESHOLD));
  const chrome = new Set([...blockCounts].filter(([, n]) => n >= chromeCutoff).map(([b]) => b));
  console.log(`  ${chrome.size} boilerplate blocks detected (on >= ${chromeCutoff} of ${docs.length} pages)`);

  // Pass 2: strip the chrome and extract.
  const pages = [];
  for (const { entry, html, $, blocks } of docs) {
    const body = blocks.filter((b) => !chrome.has(b));
    const content = body.join('\n\n');
    const media = extractMedia($, html);
    const prices = extractPrices(content);
    const title = norm($('title').text()).replace(/^רמחל\s*-\s*/, '');
    const headings = $('h1, h2, h3').map((_, el) => norm($(el).text())).get().filter(Boolean);

    pages.push({
      site: key,
      url: entry.url,
      urlDecoded: decodeSafe(entry.url),
      slug: decodeSafe(new URL(entry.url).pathname),
      title,
      headings,
      type: classify({ title, content, prices, media, url: entry.url }),
      wordCount: content.split(/\s+/).filter(Boolean).length,
      prices,
      media,
      content,
    });
  }

  pages.sort((a, b) => b.wordCount - a.wordCount);
  await mkdir(OUT_ROOT, { recursive: true });
  await writeFile(join(OUT_ROOT, `${key}.json`), JSON.stringify({ site, pages }, null, 2));

  const byType = {};
  for (const p of pages) byType[p.type] = (byType[p.type] ?? 0) + 1;
  return {
    pages: pages.length,
    byType,
    totalWords: pages.reduce((n, p) => n + p.wordCount, 0),
    youtubeRefs: pages.reduce((n, p) => n + p.media.youtube.length, 0),
    mp3Refs: pages.reduce((n, p) => n + p.media.audio.length, 0),
    pricesFound: pages.reduce((n, p) => n + p.prices.length, 0),
    emptyPages: pages.filter((p) => p.type === 'empty-or-stub').map((p) => p.urlDecoded),
  };
}

async function run() {
  const chosen = ONLY_SITE ? { [ONLY_SITE]: SITES[ONLY_SITE] } : SITES;
  const report = {};
  for (const [key, site] of Object.entries(chosen)) {
    console.log(`\n=== ${site.label} ===`);
    const r = await parseSite(key, site);
    if (r) {
      report[key] = r;
      console.log(`  types:`, r.byType);
      console.log(`  ${r.totalWords.toLocaleString()} words · ${r.youtubeRefs} YouTube refs · ${r.pricesFound} prices`);
    }
  }
  await mkdir(OUT_ROOT, { recursive: true });
  await writeFile(join(OUT_ROOT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`\nWrote out/*.json and out/report.json`);
}

run().catch((e) => { console.error(e); process.exit(1); });
