# TASK-48 — Legacy URL redirects

> Superseded in part by TASK-49: `enramhal.com` and `frramhal.com` were dropped, the OPEN items below were
> decided by the owner, and the coverage numbers are in `docs/reports/TASK-49.md`. Read this report as history.

The uncommitted `src/app/(frontend)/[locale]/page.tsx` change was left alone (the brief's commit-or-leave note was blank).

## Docs read
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` — in Next 16 the interceptor is `proxy.ts` (Node runtime, one per project);
  it runs after `next.config` redirects and before routes; `NextResponse.redirect(url, status)`; `matcher` accepts regex. The existing `src/proxy.ts` is
  extended, not replaced.
- `.../not-found.md` — a not-found file gets no route params; `usePathname` in it must be client-side.

## Data found (not guessed)
- The crawl (`scripts/scrape/out/{he,en,fr}.json`, 337 pages) holds only the friendly `.html` addresses, the three home addresses and `/site/shop/cart.asp`.
  Sitemaps list nothing else. **No `.asp?id=` product form exists in the crawl or in the crawled pages' links.** The only `.asp` forms found:
  `/site/index.asp?depart_id=…`, the cart, and the category pagination `/site/detail/detail/detailDetail.asp?detail_id=…&iPageNum=…` (from `scripts/scrape/seeds.mjs`).
  Home, `/site/index.asp` and the pagination endpoint are mapped; the query is ignored so every `?…` variant resolves.
- `Books.legacyUrls` (local DB, restored from production): 105 URLs on 62 books, all of them crawled pages, all `product` type. 175 crawled product pages exist, so 70
  are products of books that are not in the canonical catalogue (DECISIONS §12).

## Rules applied
1. Book page → that book's page in the legacy site's language (he `/ספר/…`, en `/en/book/…`, fr `/fr/livre/…`).
2. Home, `/site/index.asp`, category pagination, store/category listings (including CD/DVD, which no longer has a category — the closest listing) → home / catalogue.
3. Page equivalences, by content (`scripts/legacy-redirects/pageEquivalences.mjs`): Ramhal biography / teaching / "the Ramhal" article → `/ramhal` (he 4, en 2, fr 1);
   study hall → `/beit-ramhal` (he `/בית-רמח-ל`, en `/Bait-Ramchal`, **fr `/Institute-Ramhal`** — the French file names are swapped, decided from text);
   the Rabbi's section page → `/rabbi-chriqui` (he `/הרב-מרדכי-שריקי-שליט-א`, fr `/La-page-du-rav-Mordekhai-Chriqui` — both are landing menus for his writings;
   equivalence by role); donations → `/donate`; recorded-lesson hub and the per-book viewing pages that hold videos → `/courses`;
   the essay about the book *Mecholl LaTzadikim* → that book's own page.
4. Everything else: no redirect, real 404 (below). Contact, institute description and the mp3 archive are **OPEN** (below), so not guessed.
5. Normalization (one function, `normalizeLegacyPath`): percent-decoding (the old site wrote hyphens as `%2D`), NFC, lower case (the old server ignored case), repeated
   and trailing slashes. Query ignored. Unit-tested for each variant.

## Mechanism
- `src/lib/legacyRedirects.json` (generated, sorted; 85 + 31 + 33 entries) + `src/lib/legacyRedirects.ts` (pure lookup) + one call in `src/proxy.ts`
  (301, only for `ramhal.com` / `enramhal.com` / `frramhal.com` with or without `www`; a host check otherwise; no database).
- The proxy `matcher` used to skip every path containing a dot, which would have hidden every `.html` address; it now lets `.html` / `.asp` (any case) through.
- On a legacy host an unprefixed dead URL is rewritten onto that site's own language, so `frramhal.com/vayera.html` 404s in French.
- `[locale]/not-found.tsx` (new): title, home and catalogue links. It renders every language and CSS keeps the one matching `<html lang>`, because a not-found page gets no params.
- `npm run redirects:generate` (`scripts/generate-legacy-redirects.mjs`): deterministic (re-run gave a byte-identical file); fails on duplicate sources, a hand-table path not in the crawl,
  an unknown slug, a redirect to itself or to another redirect, an unknown legacy host.
- Tests: `legacyRedirects.test.ts` (unit, 30: every target is a current route shape in the host's language, no chains/self-redirects, sources normalized, every spelling resolves identically,
  current host untouched) and `legacyRedirects.integration.test.ts` (every book target's slug exists in the database).

## Coverage of the crawled pages
| Site | Crawled | To a book | To a page | Served as home (no redirect) | Deliberate 404 |
|---|---|---|---|---|---|
| he ramhal.com | 131 | 62 | 21 | 1 | 47 |
| en enramhal.com | 70 | 20 | 9 | 0 | 41 |
| fr frramhal.com | 136 | 23 | 8 | 0 | 105 |

(`to a page` includes each site's home; en/fr roots go to `/en`, `/fr`. Not-crawled aliases add `/site/index.asp` and the pagination endpoint per host.)

## Deliberate 404s, by breadcrumb section
"(no breadcrumb)" pages are template shells or essays the scraper could not place. Product pages are legacy products with no book in the current catalogue.
- **en · (no breadcrumb)** (9): `/חשיבות-ספר-הזוהר-מדברי-הרמח-ל.html`, `/ramhal-institute.html`, `/צור-קשר-1.html`, `/הילולת-הרמח-ל-תשע-ז-1-1.html`, `/books.html`, `/tikun-olam.html`, `/rabbi-mordechai-shriki.html`, `/mp3-1-1.html`, `/קול-קורא-1-1.html`
- **en · (product not in the catalogue)** (31): `/le-discours-de-la-délivrance.html`, `/les-voies-de-la-direction-divine-1.html`, `/מבא-לחכמת-הקבלה-4-dvd.html`, `/זוהר-תניינא-חלק-א-1.html`, `/מחזור-כוונות-ר-ה-לרמח-ל.html`, `/דברות-הרמח-ל-א-גאולה-תיקון-עולם-1-1.html`, `/la-voie-de-d-ieu-1.html`, `/קל-ח-פתחי-חכמה-cd.html`, `/אדיר-במרום-2-cd.html`, `/קנאת-ה-צבאות-cd-1.html`, `/גילוי-מלכותו-ר-ה-1.html`, `/גילוי-מלכותו-שבועות-1.html`, `/תפילות-לרמח-ל-קטן.html`, `/1les-soixante-dix-arrangements.html`, `/תיקון-עולם-dvd-1.html`, `/דעת-תבונות-cd-1.html`, `/דרך-ה-cd.html`, `/מאמר-הגאולה-cd.html`, `/סוד-היחוד-cd.html`, `/קבלת-הרמח-ל-cd.html`, `/ראש-השנה-cd-1.html`, `/י-ז-בתמוז-cd.html`, `/דרך-ה-1-1.html`, `/maamar-ha-hokhma-1.html`, `/נושאים-כלליים-1-2-3-cd.html`, `/האילן-cd-1.html`, `/חנוכה-cd-1.html`, `/פסח-cd-1.html`, `/תשעה-באב.html`, `/מחול-לצדיקים-1.html`, `/פורים-cd-1.html`
- **en · Articles** (1): `/כתבות-1.html`
- **fr · (no breadcrumb)** (8): `/פרשת-בראשית.html`, `/lekh-lekha.html`, `/nouveau.html`, `/beit-ramhal.html`, `/כתבות-1-1.html`, `/צור-קשר-1-1.html`, `/tikun-olam-1.html`, `/seminaire-kalah.html`
- **fr · (product not in the catalogue)** (37): `/la-voie-de-d-ieu.html`, `/la-métaphysique-de-lʼunité-chez-le-ramhal.html`, `/tikoun-olam.html`, `/l-essence-de-la-torah-petit-format-1.html`, `/maamar-ha-gueoula.html`, `/themes-generaux-cabale-2-set-de-2-cd-format-mp3.html`, `/maamar-ha-hokhma.html`, `/themes-generaux-cabale-1-set-de-2.html`, `/themes-generaux-cabale-3-set-de-2-cd.html`, `/la-voix-des-justes.html`, `/les-fetes-selon-la-cabale-cd-mp3.html`, `/séminaire-sur-l-âme-humaine-1-à-11.html`, `/themes-generaux-cabale-4-1-cd.html`, `/themes-generaux-cabale-5-1-cd.html`, `/les-soixante-dix-arrangements-tome-2.html`, `/10-cd-cours-en-francais-de-rav-mordekhai-chriqqui.html`, `/les-soixante-dix-arrangements-nouveau-format.html`, `/דברות-הרמח-ל-א-גאולה-תיקון-עולם-1.html`, `/kalah-pithe-hokhma-2-cd-mp3.html`, `/סידור-חול-ור-ח-כוונות-הרמח-ל.html`, `/les-voies-de-la-direction-divine.html`, `/pessah.html`, `/לשכננו-תדרושו.html`, `/les-soixante-dix-arrangements-tome1.html`, `/la-kabbale-de-la-reparation.html`, `/kalah-pithé-hokhma-ou-la-kabbale-signifiante.html`, `/זוהר-תניינא-חלק-א.html`, `/תפילות-לרמח-ל-פורמט-קטן.html`, `/דברות-רמחל-ח-א-גאולה.html`, `/דברות-רמחל-ח-ב-תפילה.html`, `/דברות-רמח-ל-ח-ג-אמונה.html`, `/דברות-רמחל-ח-ד-תשובה.html`, `/רזין-גניזין.html`, `/גילוי-מלכותו-ר-ה.html`, `/גילוי-מלכותו-שבועות.html`, `/ענייני-ר-ה-ויוה-כ.html`, `/מחזור-ר-ה-עם-כוונות-הרמח-ל.html`
- **fr · ARTICLES** (6): `/articles-kabbale.html`, `/articles-fêtes.html`, `/articles-généraux.html`, `/הילולת-הרמח-ל-תשע-ז-1.html`, `/קול-קורא-1.html`, `/yyy.html`
- **fr · Cours enregistrés** (4): `/vidéos-introduction-a-la-kabbale.html`, `/la-parasha-selon-la-kabbale.html`, `/mp3-1.html`, `/hanouka-1.html`
- **fr · La page du rav Mordékhai Chriqui** (15): `/ספר-שמות.html`, `/ספר-דברים.html`, `/ספר-במדבר.html`, `/ספר-ויקרא.html`, `/מאמרים-על-פרשת-השבוע.html`, `/articles-sur-les-fêtes.html`, `/ki-tetse.html`, `/ki-tavo.html`, `/devarim.html`, `/toldot.html`, `/vaethanan.html`, `/ekev.html`, `/reeh.html`, `/choftim.html`, `/nitsavim.html`
- **fr · La page du rav — essays (DECISIONS §14)** (35): `/vayera.html`, `/michpatim.html`, `/chemot.html`, `/pinhas.html`, `/mikets-hanouka.html`, `/haye-sarah.html`, `/vayechev.html`, `/behahalotekha-chelakh-lekha.html`, `/vayetse.html`, `/terouma-tetsave.html`, `/yitro.html`, `/bamidbar.html`, `/bo.html`, `/tazria-metsora.html`, `/vayakhel-pekoude.html`, `/aharei-mot-kadochim.html`, `/nasso.html`, `/vayichlah.html`, `/vayehi.html`, `/vayigach.html`, `/houkat.html`, `/qorah.html`, `/ki-tissa.html`, `/vaera.html`, `/matot-masse.html`, `/bechallah.html`, `/balaq.html`, `/tsav.html`, `/chemini.html`, `/behar.html`, `/emor.html`, `/vayikra.html`, `/טור-אישי-1.html`, `/hanouka.html`, `/ספר-בראשית.html`
- **he · (no breadcrumb)** (20): `/עניין-לימוד-הזוהר.html`, `/חדשות-1.html`, `/עמודה-ימנית.html`, `/mp3.html`, `/פרשת-השבוע-ואקטואליה-באספקלריית-הרמח-ל.html`, `/site/shop/cart.asp`, `/שיעורים-בזוהר-על-הסדר-לצפייה.html`, `/גיבוי.html`, `/י-ז-בתמוז-ותשעה-באב.html`, `/הילולת-הרמח-ל-התשע-ח.html`, `/שיעור-חדש.html`, `/טו-ב-בשבט.html`, `/הילולת-הרמח-ל.html`, `/קול-קורא.html`, `/אודותינו.html`, `/פורים-1.html`, `/פסח-1.html`, `/חדשות.html`, `/הילולת-רמח-ל-תשפ-ה.html`, `/test.html`
- **he · (product not in the catalogue)** (2): `/מבא-לחכמת-הקבלה-dvd.html`, `/תיקון-עולם-dvd.html`
- **he · הרב מרדכי שריקי שליט"א** (13): `/טו-ב-בשבט-1.html`, `/פורים-עד-דלא-ידע.html`, `/מאמרים-על-חגים.html`, `/פורים.html`, `/נושאים-כללים.html`, `/שבועות.html`, `/י-ז-בתמוז-תשעה-באב.html`, `/שבועות-באספקלריית-הרמח-ל.html`, `/חנוכה-באספקלריית-הרמח-ל-תשפ-ו.html`, `/חנוכה.html`, `/ימים-נוראים.html`, `/סוכות.html`, `/פסח.html`
- **he · כתבות** (1): `/כתבות.html`
- **he · מכון רמח"ל** (1): `/מכון-רמח-ל.html`
- **he · ספרי הרמח"ל** (1): `/ספרי-הרמח-ל.html`
- **he · עוד** (1): `/עוד.html`
- **he · צור קשר** (1): `/צור-קשר.html`
- **he · שיעור יומי בזוהר** (1): `/שיעור-יומי-בזוהר.html`
- **he · שיעורים מוקלטים / לצפייה** (5): `/פרשת-השבוע-ע-פ-הזוהר-מפי-הרה-ג-מרדכי-שריקי-שליט-א.html`, `/ר-ה-וכיפור.html`, `/סוכות-1.html`, `/חנוכה-1.html`, `/אדיר-במרום-לצפייה.html`
- **he · תיקון עולם** (1): `/תיקון-עולם.html`

## OPEN — decide, then add to `pageEquivalences.mjs` (or to a book's `legacyUrls` in the admin) and re-run the generator
1. **"About the institute"** (he `/מכון-רמח-ל`, en `/Ramhal-Institute`, fr `/Beit-Ramhal`): no page of the new site is that; candidates `/rabbi-chriqui` or `/beit-ramhal`.
2. **Contact pages** (he `/צור-קשר`, en `/צור-קשר-1`, fr `/צור-קשר-1-1`): there is no contact page, only the footer. A contact page, or send them to the Q&A page?
3. **The mp3 archive** (he `/mp3`, fr `/mp3-1`): the audio archive is not built (DECISIONS §6).
4. **French-only products that may be French editions of catalogue books**, e.g. `/la-voie-de-d-ieu`, `/maamar-ha-gueoula`, `/maamar-ha-hokhma`, `/tikoun-olam`,
   `/la-métaphysique-de-lʼunité-chez-le-ramhal`, and their English twins (`/la-voie-de-d-ieu-1` …). If they are, add their URLs to that book's `legacyUrls` and re-run.
5. **CD/DVD listing** goes to the catalogue although CD/DVD products are gone; a 404 is the alternative.
6. **Canonical host at cutover**: redirects keep the visitor on the host they came from (`frramhal.com/fr/livre/…`); a further hop to one canonical domain is a separate decision.
7. Trailing-slash variants take two hops (Next's own 308 removes the slash, then our 301), as shown below.
8. Not-found responses are correctly 404 but their initial HTML is Next's empty error shell; the page is drawn by the browser (verified in Chrome). Same as every `notFound()` on this site before this task.

## Verification (local Postgres, no-Neon preload)
`tsc` clean; `eslint` 0 errors (50 warnings, unchanged); `npm test` 395 passed; `npm run build` exit 0; storefront `grep` for raw form elements prints nothing.
`next build && next start`, `curl -H "Host: …"` (status → Location):
```
ramhal.com         /kabbalah-du-arizal-1.html                                     301 -> /%D7%A1%D7%A4%D7%A8/kabbalah-du-arizal
 
ramhal.com         /kabbalah-du-arizal-1.html?depart_id=367044&x=1                301 -> /%D7%A1%D7%A4%D7%A8/kabbalah-du-arizal
 
www.ramhal.com     /kabbalah-du-arizal-1.html/                                    308 -> /kabbalah-du-arizal-1.html
 
enramhal.com       /la-kabbale-de-la-reparation-1-1-1.html                        301 -> /en/book/la-kabbale-de-la-reparation
 
www.frramhal.com   /kabbalah-du-arizal.html                                       301 -> /fr/livre/kabbalah-du-arizal
 
www.frramhal.com   /KABBALAH-DU-ARIZAL.HTML                                       301 -> /fr/livre/kabbalah-du-arizal
 
ramhal.com         /הרמח-ל.html                                                   301 -> /ramhal
 
enramhal.com       /Books-In-Hebrew.HTML                                          301 -> /en/books
 
www.frramhal.com   /Institute-Ramhal.html                                         301 -> /fr/beit-ramhal
 
www.frramhal.com   /                                                              301 -> /fr
 
enramhal.com       /site/index.asp?depart_id=367044                               301 -> /en
 
ramhal.com         /site/detail/detail/detailDetail.asp?detail_id=1&iPageNum=2&se 301 -> /%D7%A1%D7%A4%D7%A8%D7%99%D7%9D
 
ramhal.com         /פורים.html                                                    404 
www.frramhal.com   /vayera.html                                                   404 
enramhal.com       /site/shop/cart.asp?depart_id=367044                           404 
localhost:3100     /kabbalah-du-arizal-1.html                                     404 
localhost:3100     /                                                              200 
localhost:3100     /logo.png                                                      200 
```
Not-found page in Chrome at `/fr/livre/nope`: "Page introuvable", the French text, and links "Accueil" and "Livres" (only the French block shows).

## Still open
Cutover DNS/Vercel domain step and the OPEN list above — in `docs/BACKLOG.md` and here.
