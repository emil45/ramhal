// Polite, cached, resumable HTTP fetching for the legacy Ramhal sites.
//
// THE ONE RULE THAT MATTERS: never decode and re-encode these URLs.
// Hebrew slugs on these sites encode the hyphen separator as %2D, not "-".
// Decoding %2D to "-" produces URLs that 404. Node's WHATWG URL preserves
// %2D as-is, so passing the raw string straight to fetch() is safe — but any
// decodeURIComponent() round-trip in between will silently break everything.

import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile, access, appendFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// robots.txt on all three hosts declares Crawl-delay: 5.
// The French host returns HTTP 429 under even light concurrency.
// This is the client's own site, but we still crawl it the way we would
// crawl a stranger's: serially, slowly, and backing off when asked to.
const CRAWL_DELAY_MS = 5000;
const MAX_RETRIES = 4;
const USER_AGENT =
  'RamhalMigrationBot/1.0 (one-time content migration for Machon Ramhal; contact the site owner)';

const lastRequestAt = new Map(); // host -> timestamp

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Stable filename for a URL. Hebrew URLs are far too long to use directly. */
export function cacheKey(url) {
  return createHash('sha1').update(url).digest('hex');
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Wait out the per-host crawl delay, with a little jitter. */
async function throttle(host) {
  const last = lastRequestAt.get(host) ?? 0;
  const wait = last + CRAWL_DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait + Math.random() * 500);
  lastRequestAt.set(host, Date.now());
}

/**
 * Fetch a URL, caching the raw body on disk.
 *
 * Crawling and parsing are deliberately separate phases. The cache means we
 * crawl these sites exactly once and can then iterate on extraction as many
 * times as we like without touching their server again.
 *
 * @returns {Promise<{url, status, body, fromCache, error?}>}
 */
export async function fetchCached(url, cacheDir) {
  const key = cacheKey(url);
  const bodyPath = join(cacheDir, `${key}.html`);
  const indexPath = join(cacheDir, 'index.jsonl');

  if (await exists(bodyPath)) {
    return { url, status: 200, body: await readFile(bodyPath, 'utf8'), fromCache: true };
  }

  const host = new URL(url).host;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await throttle(host);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*' },
        redirect: 'follow',
      });

      // 429 and 5xx are worth waiting out; the French host does both.
      if (res.status === 429 || res.status >= 500) {
        const backoff = CRAWL_DELAY_MS * Math.pow(2, attempt);
        lastError = `HTTP ${res.status}`;
        console.warn(`  ${res.status} — backing off ${backoff / 1000}s (attempt ${attempt + 1})`);
        await sleep(backoff);
        continue;
      }

      // These pages are Windows-1255 / UTF-8 depending on age. Decode by the
      // declared charset when there is one, so Hebrew does not turn to mojibake.
      const buf = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') ?? '';
      const declared = /charset=([\w-]+)/i.exec(contentType)?.[1]?.toLowerCase();
      const sniffed = /charset=["']?([\w-]+)/i
        .exec(buf.subarray(0, 2048).toString('latin1'))?.[1]?.toLowerCase();
      const charset = declared ?? sniffed ?? 'utf-8';

      let body;
      try {
        body = new TextDecoder(charset).decode(buf);
      } catch {
        body = buf.toString('utf8');
      }

      await mkdir(dirname(bodyPath), { recursive: true });
      await writeFile(bodyPath, body, 'utf8');
      await appendFile(
        indexPath,
        JSON.stringify({ key, url, status: res.status, charset, bytes: buf.length, at: new Date().toISOString() }) + '\n',
      );

      return { url, status: res.status, body, fromCache: false };
    } catch (err) {
      lastError = err.message;
      await sleep(CRAWL_DELAY_MS * Math.pow(2, attempt));
    }
  }

  await mkdir(dirname(indexPath), { recursive: true });
  await appendFile(
    indexPath,
    JSON.stringify({ key, url, status: 0, error: lastError, at: new Date().toISOString() }) + '\n',
  );
  return { url, status: 0, body: '', fromCache: false, error: lastError };
}
