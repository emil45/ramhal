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

import { readFile, writeFile, mkdir } from 'node:fs/promises';
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
// Pages below this many words of real content (after stripping chrome,
// breadcrumb, and title) are stubs, not articles — see classify().
const EMPTY_WORD_THRESHOLD = 40;

const CACHE_ROOT = join(process.cwd(), '.cache');
const OUT_ROOT = join(process.cwd(), 'out');

const decodeSafe = (u) => { try { return decodeURIComponent(u); } catch { return u; } };
// Currency before amount, or amount before currency — both occur on these pages.
const PRICE_RE = /[₪€$]\s?[\d,]+(?:\.\d{1,2})?|[\d,]+(?:\.\d{1,2})?\s?[₪€$]/;
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const wordCount = (s) => (s ? s.split(/\s+/).filter(Boolean).length : 0);

/**
 * Every leaf text block on the page, in order, paired with its element.
 *
 * "Leaf" means: this node has none of the same block-ish tags anywhere in its
 * *descendants* — including `span`. Two compounding bugs in the original:
 *
 * 1. It selected `span` but excluded on children matching only
 *    `p, div, td, li, h1-h4` — so a `<div><span>text</span></div>` emitted
 *    the div's aggregated text AND the span's text as two blocks.
 * 2. It checked `.children()` (direct children only), not `.find()` (all
 *    descendants). A `<td>` whose real content is nested two levels down,
 *    e.g. `<td>...<table><tr><td>the actual paragraph</td></tr></table></td>`,
 *    has no *direct* block-level child, so it was never excluded either —
 *    its `.text()` re-aggregates everything already counted by the nested
 *    real leaf, on top of it.
 *
 * Together these inflated word counts by roughly 4x on pages with deeply
 * nested table layouts (verified against vayera.html: 19,242 words with only
 * bug 1 fixed, 4,806 — matching the article body's own word count exactly —
 * with both fixed).
 */
const BLOCK_SELECTOR = 'p, div, td, li, h1, h2, h3, h4, span';

function blocksOf($) {
  const out = [];
  $('body')
    .find(BLOCK_SELECTOR)
    .each((_, el) => {
      const $el = $(el);
      if ($el.find(BLOCK_SELECTOR).length > 0) return;
      const text = norm($el.text());
      // Keep short blocks too when they carry a price — "₪80.00" is twelve
      // characters and is the single most important string on a product page.
      if (text.length >= 20 || PRICE_RE.test(text)) out.push({ text, el });
    });
  return out;
}

/** A block is title-shaped if its own markup is bold — real body paragraphs on
 * these pages are not. Used to tell an actual title from the first sentence
 * of body prose, so we never invent a title where the page has none. */
function isBoldBlock($, el) {
  const $el = $(el);
  return $el.is('strong, b') || $el.find('strong, b').length > 0;
}

/**
 * Every page opens with a ">>"-separated breadcrumb, e.g.
 * "Accueil >> La page du rav >> L'essence de la Torah >> ספר בראשית >> vayera",
 * in a `<td>` alongside the nav chrome (verified: `#centerWebsiteDiv td` whose
 * text contains "»»"/">>" — the surrounding `&nbsp;` collapses under norm()).
 * Returns null if a page genuinely has none (none observed so far, but the
 * legacy pages have surprised us before).
 */
function extractBreadcrumb($) {
  const $td = $('#centerWebsiteDiv td')
    .filter((_, el) => $(el).text().includes('>>'))
    .first();
  if ($td.length === 0) return null;
  const raw = norm($td.text());
  const items = raw.split(/\s*>>\s*/).map(norm).filter(Boolean);
  return { raw, items, el: $td.get(0) };
}

/**
 * The first content block after the breadcrumb, if it is title-shaped (bold —
 * see isBoldBlock). Several essays genuinely have no title line at all; for
 * those this returns null rather than promoting the opening sentence of body
 * text to a fabricated title.
 */
function extractTitle($, contentBlocks) {
  const first = contentBlocks[0];
  if (!first) return null;
  if (!isBoldBlock($, first.el)) return null;
  if (wordCount(first.text) > 30) return null; // too long to be a title, not body prose
  return first.text;
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

function parsePriceText(text) {
  const [first] = extractPrices(text);
  return first ?? null;
}

// Verified against cached pages, one per site (see scripts/scrape/README or
// the migration report for the exact source pages). "List price" is deliberately
// excluded from the field map below — it is always ₪0.00/0.00€ (a template
// default the shop never fills in) and importing it would be junk, not data.
// All three languages verified against real cached product detail pages.
const PRODUCT_LABELS = {
  he: {
    'שם המוצר/פריט': 'title',
    'מחיר מחירון': null, // list price — junk, always ₪0.00
    'המחיר שלנו': 'price',
    'מע"מ': 'vat',
    'דמי משלוח': 'shipping',
    'זמן אספקה': 'deliveryTime',
    'שם היצרן': 'publisher',
  },
  fr: {
    'Nom du produit': 'title',
    'Prix conseillé': null, // list price — junk, always 0.00€
    'Notre prix': 'price',
    'T V A': 'vat',
    "Frais d'expédition": 'shipping',
    'Délai de livraison': 'deliveryTime',
    'Nom du fabricant': 'publisher',
  },
  en: {
    'Product/Item Name': 'title',
    'List Price': null, // list price — junk, always $0.00
    'Our Price': 'price',
    Tax: 'vat',
    'Shipping Cost': 'shipping',
    'Delivery time': 'deliveryTime',
    'Manufacturer Name': 'publisher',
  },
};

/** Returns null for pages that are not product detail pages. */
function extractProduct($, siteKey) {
  const $table = $('table.sop_productInfo').first();
  if ($table.length === 0) return null;

  const labels = PRODUCT_LABELS[siteKey];
  const product = { title: null, price: null, vat: null, shipping: null, deliveryTime: null, publisher: null };

  $table.find('tr').each((_, tr) => {
    const $tds = $(tr).find('> td');
    if ($tds.length < 2) return;
    const label = norm($tds.eq(0).text()).replace(/:$/, '');
    const field = labels?.[label];
    if (!field) return; // unmapped label (e.g. list price, warranty period) — skip
    const valueText = norm($tds.eq(1).text());
    product[field] = field === 'price' || field === 'shipping' ? parsePriceText(valueText) : valueText;
  });

  // Present on every product page regardless of language — the div id is
  // fixed by the platform template, unlike its section heading text.
  const description = norm($('#longMessageMEM').text());
  product.description = description.length > 0 ? description : null;

  return product;
}

function classify({ content, product, media, url }) {
  if (product) return 'product';
  const words = wordCount(content);
  if (words < EMPTY_WORD_THRESHOLD && media.youtube.length === 0) return 'empty-or-stub';
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
    for (const b of new Set(blocks.map((b) => b.text))) blockCounts.set(b, (blockCounts.get(b) ?? 0) + 1);
    docs.push({ entry, html, $, blocks });
  }

  const chromeCutoff = Math.max(2, Math.floor(docs.length * BOILERPLATE_THRESHOLD));
  const chrome = new Set([...blockCounts].filter(([, n]) => n >= chromeCutoff).map(([b]) => b));
  console.log(`  ${chrome.size} boilerplate blocks detected (on >= ${chromeCutoff} of ${docs.length} pages)`);

  // Pass 2: strip the chrome and the breadcrumb, pull the title, extract.
  const pages = [];
  for (const { entry, html, $, blocks } of docs) {
    const breadcrumb = extractBreadcrumb($);
    const withoutChrome = blocks.filter((b) => !chrome.has(b.text) && b.text !== breadcrumb?.raw);

    const title = extractTitle($, withoutChrome);
    const contentBlocks = title !== null ? withoutChrome.slice(1) : withoutChrome;
    const content = contentBlocks.map((b) => b.text).join('\n\n');

    const media = extractMedia($, html);
    const product = extractProduct($, key);
    const prices = extractPrices(content);
    const headings = $('h1, h2, h3').map((_, el) => norm($(el).text())).get().filter(Boolean);

    pages.push({
      site: key,
      url: entry.url,
      urlDecoded: decodeSafe(entry.url),
      slug: decodeSafe(new URL(entry.url).pathname),
      breadcrumb: breadcrumb?.items ?? null,
      title,
      headings,
      type: classify({ content, product, media, url: entry.url }),
      wordCount: wordCount(content),
      product,
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
    productsFound: pages.filter((p) => p.product).length,
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
      console.log(`  ${r.totalWords.toLocaleString()} words · ${r.youtubeRefs} YouTube refs · ${r.productsFound} products`);
    }
  }
  await mkdir(OUT_ROOT, { recursive: true });
  await writeFile(join(OUT_ROOT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`\nWrote out/*.json and out/report.json`);
}

run().catch((e) => { console.error(e); process.exit(1); });
