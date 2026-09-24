# TASK-49 — Trim the legacy redirects to ramhal.com only

## Built
- Only `ramhal.com` (apex + `www`) is a legacy host. `enramhal.com` / `frramhal.com` are gone from the proxy, the
  lookup (`src/lib/legacyRedirects.ts`: `LEGACY_HOST`, `isLegacyHost`), the generator, the hand-written table and
  `src/lib/legacyRedirects.json`. With one host the table is flat (path → target) and the proxy's
  per-legacy-host language rewrite is removed. Books' `legacyUrls` on the retired domains are skipped by the generator.
- Hand table: dropped `/CD-DVD.html` (now 404). The MP3 archive, contact and "about the institute" were already
  404; the table comment now says the owner decided so. French-only product pages: no mapping.
- Scrape output files untouched.

## Coverage (replaces the TASK-48 table)
131 crawled ramhal.com pages: 62 to a book, 20 to a page, 1 served as home, 48 deliberate 404. 84 redirects written
(the crawled ones plus `/site/index.asp` and the category pagination endpoint). Re-running the generator is byte-stable.

## Verified
`tsc` clean; `eslint` 0 errors (50 pre-existing warnings); `npm test` 393 passed; `npm run build` ok.
`next start`, `curl -H "Host: …"`:
```
www.ramhal.com   /kabbalah-du-arizal-1.html   301 -> /ספר/kabbalah-du-arizal
www.ramhal.com   /CD-DVD.html                 404
www.ramhal.com   /מכון-רמח-ל                   404
www.frramhal.com /kabbalah-du-arizal-1.html   404 (no redirect)
www.frramhal.com /Livres.html                 404 (no redirect)
```
New tests: the retired hosts are ignored by `isLegacyHost` and `findLegacyRedirect`; the four dropped pages get no redirect.

## Felt wrong
Nothing.

## Open
Cutover (point `ramhal.com` + `www` at Vercel) — already in `docs/BACKLOG.md`.
