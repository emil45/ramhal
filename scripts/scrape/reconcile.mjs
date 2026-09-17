#!/usr/bin/env node
// Phase 3: does the migration's core assumption hold — that 177 product pages
// across three sites are really one catalogue sold three times? Reads only
// out/*.json (parse.mjs's output). Writes nothing to any database.
//
// Usage: node reconcile.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_ROOT = join(process.cwd(), 'out');
const SITES = ['he', 'fr', 'en'];

// ---------------------------------------------------------------------------
// Title normalisation
// ---------------------------------------------------------------------------

// Hebrew niqqud (vowel points) and cantillation marks — never present in a
// machine-typed shop title, but stripped defensively.
const NIQQUD_RE = /[֑-ׇ]/g;
// Every quote-like character seen in these titles: ASCII straight double and
// single quotes, and the real Hebrew gershayim/geresh. Verified real variance
// across sites: "רמח\"ל" (quoted) vs "רמחל" (quote dropped entirely) is the
// same word on the French site alone — so these are stripped, not collapsed
// to one canonical quote, since which quote character (if any) survives is
// inconsistent per-editor, not meaningful.
const QUOTE_RE = /["'׳״]/g;

function normalizeTitle(title) {
  return title
    .replace(NIQQUD_RE, '')
    .replace(QUOTE_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Similarity, for the AMBIGUOUS pass only — never used to auto-merge.
// ---------------------------------------------------------------------------

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** 1.0 = identical, 0.0 = nothing in common. */
function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// Titles more similar than this, but not exactly equal, are a candidate for
// human review — not merged. Chosen high enough that "same title, quote
// dropped" (already handled by normalizeTitle) doesn't dominate, but low
// enough to catch near-identical titles. Deliberately NOT tuned to make the
// bucket counts look tidy — see the AMBIGUOUS bucket for what it actually
// catches, including likely-false positives like two different-coloured
// editions of the same machzor.
const AMBIGUOUS_THRESHOLD = 0.82;

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

async function loadSite(key) {
  try {
    const raw = await readFile(join(OUT_ROOT, `${key}.json`), 'utf8');
    return JSON.parse(raw).pages;
  } catch {
    console.warn(`  no out/${key}.json — run parse.mjs first`);
    return [];
  }
}

/**
 * Collapses same-site duplicate URLs for the same normalised title into one
 * entry, keeping every URL — this is exactly the %2D-vs-literal-hyphen
 * pattern (e.g. "La-Voie-de-D-ieu.html" and "La%2DVoie%2Dde%2DD%2Dieu.html"
 * are the same page, cached twice under different hashes) plus any genuine
 * case of one title reachable at more than one path.
 */
function dedupeSameSite(pages, siteKey) {
  const byTitle = new Map();
  for (const page of pages) {
    const norm = normalizeTitle(page.product.title);
    if (!byTitle.has(norm)) {
      byTitle.set(norm, {
        site: siteKey,
        normTitle: norm,
        titles: new Set(),
        pages: [],
      });
    }
    const entry = byTitle.get(norm);
    entry.titles.add(page.product.title);
    entry.pages.push(page);
  }
  return byTitle;
}

// ---------------------------------------------------------------------------
// Cross-site matching
// ---------------------------------------------------------------------------

function buildCandidates(perSite) {
  // normTitle -> { he?: entry, fr?: entry, en?: entry }
  const exact = new Map();
  for (const site of SITES) {
    for (const [norm, entry] of perSite[site]) {
      if (!exact.has(norm)) exact.set(norm, {});
      exact.get(norm)[site] = entry;
    }
  }

  const confident = [];
  const exactOrphans = []; // appear under one exact normTitle, on one site only

  for (const [norm, bySite] of exact) {
    const sitesPresent = SITES.filter((s) => bySite[s]);
    if (sitesPresent.length >= 2) {
      confident.push({ normTitle: norm, bySite, matchedOn: 'exact-title', sites: sitesPresent });
    } else {
      exactOrphans.push({ normTitle: norm, site: sitesPresent[0], entry: bySite[sitesPresent[0]] });
    }
  }

  // Fuzzy pass over orphans only, cross-site pairs only. Union-find so a
  // title that plausibly matches two different candidates forms one cluster
  // flagged as "matches more than one candidate", per the brief, rather than
  // being silently paired with whichever we saw first.
  const parent = exactOrphans.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (i, j) => { const a = find(i), b = find(j); if (a !== b) parent[a] = b; };

  const edges = [];
  for (let i = 0; i < exactOrphans.length; i++) {
    for (let j = i + 1; j < exactOrphans.length; j++) {
      if (exactOrphans[i].site === exactOrphans[j].site) continue; // only cross-site
      const score = similarity(exactOrphans[i].normTitle, exactOrphans[j].normTitle);
      if (score >= AMBIGUOUS_THRESHOLD) {
        edges.push({ i, j, score });
        union(i, j);
      }
    }
  }

  const clusters = new Map(); // root -> indices[]
  for (let i = 0; i < exactOrphans.length; i++) {
    const root = find(i);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(i);
  }

  const ambiguous = [];
  const singleton = [];
  for (const indices of clusters.values()) {
    if (indices.length === 1) {
      const o = exactOrphans[indices[0]];
      singleton.push({ normTitle: o.normTitle, bySite: { [o.site]: o.entry }, sites: [o.site] });
    } else {
      const members = indices.map((i) => exactOrphans[i]);
      const bySite = {};
      for (const m of members) bySite[m.site] = m.entry; // last-wins if same site collides in a cluster
      ambiguous.push({
        members: members.map((m) => ({ site: m.site, normTitle: m.normTitle, titles: [...m.entry.titles] })),
        pairScores: edges
          .filter(({ i, j }) => indices.includes(i) && indices.includes(j))
          .map(({ i, j, score }) => ({
            a: `${exactOrphans[i].site}:${exactOrphans[i].normTitle}`,
            b: `${exactOrphans[j].site}:${exactOrphans[j].normTitle}`,
            score: Math.round(score * 1000) / 1000,
          })),
        bySite,
        sites: Object.keys(bySite),
      });
    }
  }

  return { confident, ambiguous, singleton };
}

// ---------------------------------------------------------------------------
// "What would be imported" per candidate
// ---------------------------------------------------------------------------

// Illustrative only, for flagging implausible price gaps — NOT an authoritative
// exchange rate and never used to alter data. ~3.7 ILS/EUR, ~3.4 ILS/USD,
// representative of the 2026 range, rounded for readability.
const ILS_PER = { ILS: 1, '₪': 1, EUR: 3.7, '€': 3.7, USD: 3.4, $: 3.4 };

function legacyUrls(bySite) {
  const urls = [];
  for (const site of SITES) {
    const entry = bySite[site];
    if (!entry) continue;
    for (const page of entry.pages) urls.push({ site, url: page.url });
  }
  return urls;
}

function categoryOf(page) {
  if (!page.breadcrumb || page.breadcrumb.length < 2) return null;
  return page.breadcrumb[page.breadcrumb.length - 2];
}

// The same 5 real categories, in each site's own language — the exact
// translations already used in src/seed.ts's CATEGORIES. Without this,
// comparing raw category strings across sites (e.g. "ספרים בעברית" vs
// "Livres en hébreu") looks like a disagreement when it's a translation of
// the identical category. Only the 5 known categories are canonicalised;
// anything unrecognised is left as its raw string, which WILL show as a
// disagreement if it differs — that's a real signal, not noise.
const CATEGORY_CANON = {
  'ספרים בעברית': 'hebrew-books', 'Hebrew Books': 'hebrew-books', 'Livres en hébreu': 'hebrew-books',
  'ספרים בצרפתית': 'french-books', 'French Books': 'french-books', 'Livres en français': 'french-books',
  'ספרים באנגלית': 'english-books', 'English Books': 'english-books', 'Livres en anglais': 'english-books',
  'סידורים ומחזורים': 'siddurim-machzorim', 'Siddurim and Machzorim': 'siddurim-machzorim', "Sidourim et Ma'hzorim": 'siddurim-machzorim',
  'CD/DVD': 'cd-dvd',
};
const canonicalCategory = (raw) => (raw ? (CATEGORY_CANON[raw] ?? raw) : null);

function buildImportView(bySite) {
  const titles = {};
  const descriptions = {};
  const prices = {};
  const categories = {};
  for (const site of SITES) {
    const entry = bySite[site];
    if (!entry) continue;
    const page = entry.pages[0]; // representative page for this site's title
    titles[site] = [...entry.titles];
    descriptions[site] = page.product.description;
    prices[site] = page.product.price;
    categories[site] = entry.pages.map(categoryOf).find((c) => c) ?? null;
  }

  const missingDescriptionIn = SITES.filter((s) => bySite[s] && !descriptions[s]);
  const missingPriceIn = SITES.filter((s) => bySite[s] && !prices[s]);
  const missingFromSite = SITES.filter((s) => !bySite[s]);

  const canonicalCategories = [...new Set(Object.values(categories).filter(Boolean).map(canonicalCategory))];
  const categoryDisagreement = canonicalCategories.length > 1;

  const ilsEquivalents = Object.entries(prices)
    .filter(([, p]) => p)
    .map(([site, p]) => ({ site, ils: p.value * (ILS_PER[p.currency] ?? null) }))
    .filter((x) => x.ils != null);
  let priceImplausible = false;
  if (ilsEquivalents.length >= 2) {
    const vals = ilsEquivalents.map((x) => x.ils);
    const ratio = Math.max(...vals) / Math.min(...vals);
    priceImplausible = ratio > 1.6; // beyond normal rounding/shipping noise
  }

  return {
    titles,
    descriptions,
    missingDescriptionIn,
    prices,
    missingPriceIn,
    priceImplausible,
    categories,
    categoryDisagreement,
    missingFromSite,
    legacyUrls: legacyUrls(bySite),
    heMissingButElsewhere: !bySite.he && (bySite.fr || bySite.en) ? true : false,
    needsHuman:
      missingDescriptionIn.length > 0 ||
      categoryDisagreement ||
      priceImplausible ||
      (!bySite.he && (bySite.fr || bySite.en)),
  };
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

// The five books of the Torah and their real parsha counts — Genesis 12,
// Exodus 11, Leviticus 10, Numbers 10, Deuteronomy 11 (54 total). Used only
// as a denominator for coverage, never to guess which named parsha a given
// French slug corresponds to — that mapping isn't in this data and isn't
// guessed here.
const PARSHA_COUNT_BY_BOOK = {
  'ספר בראשית': 12,
  'ספר שמות': 11,
  'ספר ויקרא': 10,
  'ספר במדבר': 10,
  'ספר דברים': 11,
};

function reconcileArticles(bySitePages) {
  const frArticles = bySitePages.fr.filter((p) => p.type === 'long-article');

  const byBook = new Map();
  const noBreadcrumb = [];
  for (const article of frArticles) {
    const book = article.breadcrumb?.[3] ?? null;
    const slug = article.breadcrumb?.[4] ?? article.slug;
    const record = { title: article.title, slug, url: article.url };
    if (!book) {
      noBreadcrumb.push(record);
      continue;
    }
    if (!byBook.has(book)) byBook.set(book, []);
    byBook.get(book).push(record);
  }

  const coverage = [...byBook.entries()].map(([book, articles]) => ({
    book,
    found: articles.length,
    expected: PARSHA_COUNT_BY_BOOK[book] ?? null,
    articles,
  }));

  const heArticles = bySitePages.he
    .filter((p) => p.type === 'long-article')
    .map((p) => ({ title: p.title, url: p.url, breadcrumb: p.breadcrumb }));
  const enArticles = bySitePages.en
    .filter((p) => p.type === 'long-article')
    .map((p) => ({ title: p.title, url: p.url, breadcrumb: p.breadcrumb }));

  // Cross-language match attempt: exact normalized title only, both sides
  // non-null. French essay titles are in French; he/en article titles came
  // back mostly null (they're institutional pages, not parsha essays) — so
  // this is expected to find ~nothing, which is itself the finding.
  const titled = (list) => list.filter((a) => a.title);
  const crossLanguageMatches = [];
  for (const fr of titled(frArticles)) {
    for (const other of [...titled(heArticles), ...titled(enArticles)]) {
      if (normalizeTitle(fr.title) === normalizeTitle(other.title)) {
        crossLanguageMatches.push({ fr: fr.title, other: other.title, otherUrl: other.url });
      }
    }
  }

  return {
    frenchByBook: coverage,
    frenchNoBreadcrumb: noBreadcrumb,
    frenchTotal: frArticles.length,
    hebrewArticles: heArticles,
    englishArticles: enArticles,
    crossLanguageMatches,
    note:
      'Hebrew and English long-articles are institutional pages (about the Rav, about the institute), ' +
      'not parsha essays, and mostly have no extractable title (see extractTitle in parse.mjs — no bold ' +
      'title-shaped block). No breadcrumb-based book/parsha grouping applies to them.',
  };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function run() {
  const bySitePages = {};
  for (const site of SITES) bySitePages[site] = await loadSite(site);

  const perSite = {};
  for (const site of SITES) {
    const products = bySitePages[site].filter((p) => p.type === 'product');
    perSite[site] = dedupeSameSite(products, site);
  }

  const totalProductPages = SITES.reduce((n, s) => n + bySitePages[s].filter((p) => p.type === 'product').length, 0);
  const totalDedupedEntries = SITES.reduce((n, s) => n + perSite[s].size, 0);

  const { confident, ambiguous, singleton } = buildCandidates(perSite);

  const books = {
    confident: confident.map((c) => ({ ...c, import: buildImportView(c.bySite) })),
    singleton: singleton.map((c) => ({ ...c, import: buildImportView(c.bySite) })),
    ambiguous, // deliberately NOT given an import view — nothing should be imported from these yet
  };

  const articles = reconcileArticles(bySitePages);

  const needsHumanBooks = [...books.confident, ...books.singleton].filter((c) => c.import.needsHuman);

  const estimatedUniqueBooks = books.confident.length + books.singleton.length + books.ambiguous.length;

  const report = {
    generatedAt: new Date().toISOString(),
    products: {
      totalPagesAcrossSites: totalProductPages,
      totalAfterSameSiteUrlDedup: totalDedupedEntries,
      confidentCount: books.confident.length,
      ambiguousCount: books.ambiguous.length,
      singletonCount: books.singleton.length,
      estimatedUniqueBooks,
      needsHumanCount: needsHumanBooks.length,
    },
    articles: {
      frenchTotal: articles.frenchTotal,
      frenchNoBreadcrumbCount: articles.frenchNoBreadcrumb.length,
      hebrewCount: articles.hebrewArticles.length,
      englishCount: articles.englishArticles.length,
      crossLanguageMatchCount: articles.crossLanguageMatches.length,
    },
    books,
    articleDetail: articles,
  };

  await writeFile(join(OUT_ROOT, 'reconciliation.json'), JSON.stringify(report, null, 2));

  // --- human-readable summary ---
  console.log('=== Products ===');
  console.log(`${totalProductPages} product pages -> ${totalDedupedEntries} after same-site URL dedup`);
  console.log(`  CONFIDENT:  ${books.confident.length}`);
  console.log(`  AMBIGUOUS:  ${books.ambiguous.length}  (clusters needing a human decision, NOT counted as resolved)`);
  console.log(`  SINGLETON:  ${books.singleton.length}`);
  console.log(`  Estimated unique books: ~${estimatedUniqueBooks} (confident + singleton + one-per-ambiguous-cluster, pending review)`);
  console.log(`  Needs human attention: ${needsHumanBooks.length} of ${books.confident.length + books.singleton.length} matched/singleton books`);

  console.log('\n=== Articles ===');
  console.log(`French long-articles: ${articles.frenchTotal} (${articles.frenchNoBreadcrumb.length} with no breadcrumb)`);
  for (const b of articles.frenchByBook) {
    console.log(`  ${b.book}: ${b.found}${b.expected ? `/${b.expected}` : ''} parshiyot with an essay`);
  }
  console.log(`Hebrew long-articles: ${articles.hebrewArticles.length} (institutional, not parsha essays)`);
  console.log(`English long-articles: ${articles.englishArticles.length} (institutional, not parsha essays)`);
  console.log(`Cross-language title matches found: ${articles.crossLanguageMatches.length}`);

  console.log('\n=== Top 20 needing a decision ===');
  const decisionItems = [
    ...books.ambiguous.map((a) => ({
      kind: 'AMBIGUOUS',
      label: a.members.map((m) => `${m.site}:${m.titles[0]}`).join(' ~ '),
      detail: a.pairScores.map((p) => `${p.a} ~ ${p.b} (${p.score})`).join('; '),
    })),
    ...needsHumanBooks.map((c) => ({
      kind: c.import.priceImplausible
        ? 'PRICE'
        : c.import.categoryDisagreement
          ? 'CATEGORY'
          : c.import.heMissingButElsewhere
            ? 'NOT-ON-HE'
            : 'DESCRIPTION',
      label: Object.values(c.import.titles)[0]?.[0] ?? c.normTitle,
      detail: JSON.stringify({
        sites: c.sites,
        prices: c.import.prices,
        categories: c.import.categories,
        missingDescriptionIn: c.import.missingDescriptionIn,
      }),
    })),
  ];
  for (const item of decisionItems.slice(0, 20)) {
    console.log(`[${item.kind}] ${item.label}`);
    console.log(`  ${item.detail}`);
  }

  console.log(`\nWrote out/reconciliation.json`);
}

run().catch((e) => { console.error(e); process.exit(1); });
