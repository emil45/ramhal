# Machon Ramhal — Website Rebuild: Project Context

> **What this document is.** Background context for anyone — human or AI — joining this project.
> It describes *what exists* and *what is wanted*. It deliberately contains **no technical decisions,
> no stack choices, and no proposed solutions**. Those live elsewhere.
>
> Compiled from a direct crawl of all three live websites, September 2026.

---

## 1. The subject

Three entities matter here, and the relationship between them is the story the site has to tell.

### רמח״ל — Rabbi Moshe Chaim Luzzatto (1707–1746)

Known by the acronym **Ramhal** (רמח״ל). Born in the Jewish ghetto of Padua, Italy. A kabbalist,
philosopher, ethicist, poet and playwright, regarded as one of the most systematic minds in Jewish
thought. At around twenty he reported receiving a *maggid* — an inner revelatory voice — which drew
intense opposition from the rabbinic establishment of his day. Much of his writing was suppressed,
banned or lost during his lifetime. He died in Acre at 39.

His works are now foundational across the Jewish world. The best known include:

- **מסילת ישרים** (Mesillat Yesharim, *The Path of the Just*) — ethics; among the most widely studied Jewish books ever written
- **דעת תבונות** (Daat Tevunot) — theology in dialogue form
- **דרך ה׳** (Derech Hashem, *The Way of God*) — a systematic account of Jewish metaphysics
- **קל״ח פתחי חכמה** (Kalach Pitchei Chochma, *138 Openings of Wisdom*) — Lurianic kabbalah
- **אדיר במרום** (Adir BaMarom) — commentary on the Idra Rabba of the Zohar
- **מאמר הגאולה** (Maamar HaGeulah) — on redemption
- **קנאת ה׳ צבאות**, **תיקונים חדשים**, **משכני עליון**, **רזין גניזין**, and many more

A recurring theme in the institute's framing: Ramhal was recognised as a genius only after his death,
and the work of publishing him is understood as a rectification of that neglect.

### הרב מרדכי שריקי — Rabbi Mordechai Chriqui

Also transliterated **Shriki**, **Tsriki**, **Chriqui**. Born 16 August 1959 in Casablanca, Morocco.
Educated in Morocco, France and Canada. Holds an MA in Religious Sciences from Concordia University
(thesis: *Le Maguid et les écrits zohariques du Ramhal*), with doctoral research at the Sorbonne on
kabbalah as metaphysics. Based in **Har Nof, Jerusalem**. Moroccan-French-Israeli. Dati Leumi.

He is widely regarded as **the** contemporary authority on Ramhal. He has devoted his life to
publishing, editing, translating and teaching Ramhal's writings. His own commentary carries the name
**כתר מרדכי** (Keter Mordechai), which distinguishes his editions from other publishers'.

He works in three distinct capacities, and any catalogue should separate them:

- **Editor** of Ramhal manuscripts and critical editions
- **Translator** of Ramhal into French
- **Author** of original studies

He is also a public lecturer with a substantial presence in the French-speaking Jewish world
(Consistoire de Paris, Torah-Box, Akadem, Beit Ha Zohar), and an academic with **57 papers on
Academia.edu**.

**He built the entire enterprise.** He is not an "About the founder" footnote — he is the face and
the authority of the institute, and the site is in large part a representation of him.

### מכון רמח״ל — Machon Ramhal / Institut Ramhal

The publishing and teaching institute he founded. Its purpose, in the institute's own English words,
is *"the spread of education and the thought of Ramhal worldwide."*

It publishes books, runs a kollel, holds daily and weekly shiurim, records and distributes lectures,
and sells its editions.

**Founding year — RESOLVED.** The institute's own 40th-anniversary logo reads **1986–2026 /
תשמ״ו–תשפ״ו**, so the founding year is **1986**, not the 1985 stated on some of their own pages.
2026 is therefore their fortieth-anniversary year — a real hook for the new site. The published
book count is still inconsistent across their properties ("more than twenty-five, including eight
in French", "approximately thirty", "over thirty", "about twenty") and remains open.

### בית רמח״ל — Beit Ramhal

The institute's physical home in **Har Nof, Jerusalem** — a beit midrash and synagogue built as a
**replica of the destroyed Padua synagogue** where Ramhal himself prayed. Approximately 1,200 m²
across four floors. Houses roughly 15 full-time scholars, with 50+ attending classes (figures as
stated in 2015).

---

## 2. The task

The institute's web presence is to be **rebuilt from scratch**. The existing sites are considered
unsuitable: not mobile-friendly, visually dated, poor usability, built on roughly 2010-era technology.
A fresh start is intended — the current presentation is not to be preserved.

The site is understood by the client as something **כולל — comprehensive, broad**. Not a thin
marketing page but a full representation of the institute, the Rav, and the body of work.

The books are framed as **פרי היצירה** — the fruit of the Rav's and the institute's creative work.
They are the achievement, not merchandise.

---

## 3. What exists today

### 3.1 Three websites, one installation

| Domain | Language | Currency | State |
|---|---|---|---|
| **ramhal.com** | Hebrew | ₪ ILS | Live, actively maintained through 2025/26 |
| **frramhal.com** | French | € EUR | Live, substantial but half-finished |
| **enramhal.com** | Nominally English | $ USD | Live, effectively abandoned since ~2017 |

These are **not three sites**. All three declare the same account identifier (`depart_id=367044`),
share a byte-similar `robots.txt`, use the same asset CDN and carry an **identical Hebrew footer**.
They are one installation wearing three domains.

**The split was never about language — it was about currency and shipping.** The Hebrew store carries
an explicit banner: *"החנות באתר בעברית מיועדת אך ורק ללקוחות בישראל"* — the Hebrew store is for
Israeli customers only. The platform could not handle multiple currencies or shipping zones, so the
whole site was cloned per market.

**Consequence:** one catalogue and one body of teaching is maintained by hand in three places, and the
three have drifted apart.

### 3.2 enramhal.com is not an English site

This is the single most misleading thing about the current setup.

- Menus, body text, product names and footer are **Hebrew**
- Genuine English prose totals roughly **900–1,000 words across three pages**, and reads as machine
  translation from French (e.g. *"Kalah Hochma Pith"* for *Kal"ach Pitchei Chochma*; *"awards"* for
  French *bourses*, meaning stipends)
- Several pages — Tikun Olam, Rabbi Mordechai Shriki, Recorded Lectures, mp3 — have **no unique
  content at all**
- Its newest dated item is from **2017**; the Hebrew site carries content from 2025/26
- **Its "Books in English" category contains zero products** — while the *Hebrew* site sells the
  institute's two English titles, described in Hebrew and priced in shekels

An English-speaking visitor is currently served almost nothing.

### 3.3 The platform

A proprietary Israeli classic-ASP website builder (footer credits **Element Israel**; staging URLs
point at **showenter.com**). Assets on `sfilev2.f-static.com`.

Characteristics relevant to anyone working with it:

- Flat `.html` pages at the domain root; internal endpoints are `.asp`
- Hebrew slugs are UTF-8 percent-encoded, and **the hyphen separator is encoded as `%2D`, not a
  literal `-`** — decoding it produces URLs that 404
- Gershayim in Hebrew titles are stripped, so `רמח״ל` becomes `רמח-ל` in slugs
- `sitemap.xml` returns HTTP 500 on all three domains; the real sitemap is at
  `/sitemap.asp?depart_id=367044`
- `robots.txt` declares `Crawl-delay: 5`; the French host returns HTTP 429 under light concurrency
- No export function, no database access, no plugin ecosystem
- Six navigation items on the Hebrew site still point at the builder's **staging host**
  (`ohadc.me.showenter.com`)

### 3.4 Other web properties

| Property | Status |
|---|---|
| `ramhal.yalla.co.il/store/146931` | Legacy storefront on a different builder, different store ID. Still search-indexed. **Broken SSL certificate** (hostname mismatch) |
| `zohar-israel.com` | Affiliated. "זוהר לישראל" daily-Zohar project. **Hosts 259 MP3 lessons of אדיר במרום** |
| `server5.mp100.info` | Third-party MP3 host used by the main site. Directory-browser interface, Hebrew and French folders. Currently forbids downloading |
| `kabbale-ramhal-france.jimdofree.com` | French satellite site on a free Jimdo tier |
| `unem.academia.edu/MORDEKHAICHRIQUI` | The Rav's academic profile — **57 papers**, 1,345 followers |
| `ramhal.net` | **Confirmed NOT affiliated.** A separate organisation ("קהילת הרמח״ל"), also Ramhal-focused, also selling books, on a similar domain name. Nothing to do with Machon Ramhal — but a live brand-confusion risk for anyone searching |

---

## 4. Content inventory

### 4.1 Store catalogue — 164 product listings across three sites

The three catalogues are **not the same books**.

| Site | Products | Categories |
|---|---|---|
| Hebrew (₪) | **64** | Hebrew books (51), French books (9), English books (2), CD/DVD (2) |
| French (€) | **49** | French books (15), Hebrew books (24), CD/DVD (10) |
| English ($) | **51** | Hebrew books (27), French books (6), CD/DVD (18), **English books (0)** |

Whole product lines exist only on the Hebrew site: the **דברות הרמח״ל** series (8 volumes plus a
7-volume set at ₪230), **זוהר השלם** (₪300), the **מחזור כיפור** editions (₪130 each), **סט ספרי
הגאולה** (₪300), **הגדה של פסח לרמח״ל**, **סידור כוונות לשבת** in leather (₪200), and more.

Price range runs from ₪15 (דרך חכמה) to ₪300 (זוהר השלם / סט ספרי הגאולה) — these are not
"cheap" and "expensive" products but different scales of the same publishing undertaking.

Product pages carry: title, list price, selling price, VAT-included note, shipping cost, delivery
time (20–22 business days), manufacturer, free-text description, quantity selector, add-to-cart.

**Flat shipping differs wildly by site: ₪30 (Hebrew, free self-pickup) · €50 (French) · $86
(English).**

Roughly 11 Hebrew product pages on the French site and 6 on the English site exist in the sitemap but
are absent from the browsable category grids. The French **CD/DVD category has no reachable page at
all** — its 10 products are only findable via product breadcrumbs.

### 4.2 Hebrew articles and teaching content

- **6 general articles** in the כתבות section — flat list, no dates, no authors, no pagination. The
  longest, *חשיבות לימוד הזוהר ע״פ הרמח״ל*, runs 8,000+ words with extensive block quotes from
  Ramhal's letters
- **12 holiday teaching pages** — ימים נוראים, סוכות, חנוכה, פורים, פסח, שבועות, ט״ו בשבט,
  י״ז בתמוז ותשעה באב, and others
- **Institutional pages** — מכון רמח״ל, בית רמח״ל, תולדות הרמח״ל (full biography), הרב מרדכי שריקי,
  רמח״ל ותורתו, תיקון עולם, donations, contact
- **7 stub pages** that render the homepage template with only the `<title>` differing — including
  one literally named `גיבוי` (backup) and one named `test.html`

**Warning for anyone mapping this content:** on the Hebrew site the *text* article and the *video*
page for a holiday are distinguished only by a `-1` suffix — `/סוכות.html` is the article,
`/סוכות-1.html` is the video page. For ט״ו בשבט the convention is reversed.

No article anywhere carries a publication date or byline.

### 4.3 The French parsha commentaries — the best original writing on any of the sites

Under **"L'essence de la Torah"**: **44 pages, of which 35 contain full essays** totalling roughly
**85,000–95,000 words of original French commentary**. Not translations.

| Book | Pages | With content |
|---|---|---|
| Genèse | 12 | 11 |
| Exode | 9 | 9 |
| Lévitique | 7 | 7 |
| Nombres | 8 | 8 |
| **Deutéronome** | **8** | **0 — all empty** |

Essays range from ~1,000 to ~8,500 words. The longest is *VAYERA: LE LIGOTAGE D'ISAAC, OU COMMENT
TRANSFORMER LA VOLONTE HUMAINE EN VOLONTE DIVINE*.

Titles are inconsistent — several essays have no title line at all. Slugs frequently do not match
content: **Noa'h lives at `/NOUVEAU.html`**, and an essay on **Kippour lives at `/Hanouka.html`**.

The French site's article categories — **Kabbale, Fêtes, Généraux** — are all marked
**"EN CONSTRUCTION"** and contain zero articles. All six of its homepage hero tiles return HTTP 500.

### 4.4 Media — the institute's largest asset by far

**YouTube** — channel `@ramhalInstit` (`UCDIGQLzR9CylDHD00XU9LRw`), open since November 2009.

- Approximately **1,897 videos**
- Approximately **3,940 subscribers**, ~732,000 lifetime views (≈385 views per video — a deep
  archive with a small, devoted audience)
- **Currently uploading at near-daily cadence** — roughly 13 uploads per fortnight as of Sept 2026
- **Hebrew and French mixed on the same channel, with no language tagging**. No English content
- Series include דרך השם (114 videos), דעת תבונות, קל״ח פתחי חכמה, אדיר במרום (**200+ parts** — one
  video found is shiur 210), מאמר הגאולה, קנאת ה׳ צבאות, תיקונים חדשים, כללים ראשונים, מאמר העיקרים,
  and weekly parasha according to the Zohar
- The channel does live streams

The websites surface perhaps 80 of these videos, as hardcoded embeds with no titles.

**Audio** — **259 MP3 lessons of אדיר במרום** hosted on `zohar-israel.com`, plus Hebrew and French
lecture directories on `server5.mp100.info`, which currently permits listening but not downloading.
Total file count unknown.

**No podcast exists on any platform.** No Spotify, no Apple Podcasts, no RSS feed. No Instagram or
TikTok.

**Third-party distribution:** Torah-Box (~18 French lectures, the highest-traffic French inbound
link), Akadem, Beit Ha Zohar, Consistoire de Paris. At least one other YouTube channel re-uploads his
shiurim.

**Social:** Facebook `RamhalInstitute` and `daattvunot`, Twitter/X `RamhalInstitute` — all activity
levels unverified. A **dead Google+ link appears on every page of all three sites**.

### 4.5 Texts of shiurim

The client has referred to **טקסטים של שיעורים** — written versions of the lectures — as part of the
body of content. Their extent, format and location are not yet established.

---

## 5. How the store works today

- Customers order through the site; **orders arrive in an admin panel** which the Rav uses and is
  satisfied with
- The admin shows **whether the PayPal payment was received or not**
- The admin shows **whether the customer wants to be telephoned** — i.e. there is a *pay-by-phone*
  path where card details are taken over the phone, alongside PayPal
- Payment is currently **PayPal only** online
- The institute has a **local Israeli credit-card vendor** it already works with in person; that
  vendor also supports online transactions. The specific vendor has not yet been named
- Shipping is a **flat rate per site**, with 20–22 business day delivery quoted
- Hebrew-site delivery is **Israel-only**, with free self-pickup

---

## 6. The audiences

1. **Hebrew-speaking Israelis** — the primary and best-served audience. Buys in shekels, collects in
   person or ships domestically
2. **French-speaking Jews**, largely in France — a genuinely significant audience with real original
   content written for it, and an established third-party presence (Torah-Box, Akadem, Consistoire)
3. **English speakers** — currently served almost nothing, despite the institute's stated worldwide
   mission and two English titles in print
4. **Religious Israelis who do not use YouTube** — a real and specific segment. The client has stated
   that MP3 hosting is a requirement *because* of listeners who will not or cannot use YouTube. Many
   in this group use filtered internet, kosher phones, older devices, and limited data
5. **Institutional / bulk buyers** — implied by the requested free-shipping-over-ten-books rule.
   Synagogues, schools and kollels buying sets rather than individuals buying single volumes

---

## 7. Operating constraints

- **Current spend is approximately ₪339 per three months** for the site, admin and hosting —
  about ₪113/month — **plus roughly ₪500/year for MP3 hosting**. Total in the region of
  **₪1,850/year (~$500)**
- **There is no maintenance retainer.** Nobody is paid to watch the site after handover
- **Content must be editable by institute staff without a developer**, in Hebrew, by people who are
  not technical
- The site must therefore be able to survive years of low-attention operation without rotting

---

## 8. Current problems — observed, not inferred

- Not responsive; unusable on mobile
- Visually dated; poor usability
- The same catalogue maintained by hand in three places, now drifted apart
- The English audience unserved despite a domain dedicated to it
- The French content half-built and its homepage entirely broken
- A ~1,900-video archive with no navigable index anywhere
- A 259-lesson audio archive on someone else's website
- Ninety thousand words of French scholarship with no way to browse it
- 57 academic papers living on Academia.edu, disconnected from the institute's own site
- No podcast distribution of any kind
- Legacy properties still indexed, one with a broken SSL certificate
- Dead Google+ links site-wide; staging-domain URLs leaking into live navigation
- Inconsistent contact details across sites (`ramhalcom@gmail.com` vs `ramhal1@bezeqint.net`)
- Inconsistent institutional facts (founding year, book count) across the institute's own pages

---

## 9. What the institute has asked for

Stated by the client, recorded here as requirements — not as decisions about how to meet them.

- **Hebrew, English and French are all required.** English and French are described as a must
- A **customisable shop**, specifically: shipping that costs more above a certain number of books,
  and **free shipping above ten books**; described as needing to be "versatile"
- The existing **order dashboard functionality preserved** — payment received or not, phone-contact
  flag
- Consideration of the **local Israeli card vendor** for online transactions
- A **front page that can carry announcements** — messages, upcoming lectures, new books
- **MP3 audio hosted and served by the institute**, for listeners who do not use YouTube
- **Videos remain on YouTube**
- The full existing archive **migrated, not discarded**

---

## 10. Known unknowns

- Brand and visual identity assets — logo, fonts, colours, printed book design (client will provide
  later)
- Order volume per month
- Which Israeli card vendor, and whether instalment payments (תשלומים) are wanted
- Total MP3 file count and whether server access is available
- Whether the MP3 recordings are the same shiurim as the YouTube videos or a separate body
- Whether טקסטים של שיעורים exist as files, and in what quantity
- Who wrote the 35 French parsha essays and whether that person is still writing
- Who holds YouTube channel access
- Correct founding year and published book count
- Whether the flat shipping rates reflect real costs

---

## 11. Glossary

| Term | Meaning |
|---|---|
| רמח״ל / Ramhal | Rabbi Moshe Chaim Luzzatto (1707–1746), the subject of the institute |
| מכון רמח״ל | Machon Ramhal — the institute; "Institut Ramhal" in French |
| בית רמח״ל | Beit Ramhal — the physical beit midrash and synagogue in Har Nof, Jerusalem |
| כתר מרדכי | Keter Mordechai — Rabbi Chriqui's own commentary name |
| שיעור / שיעורים | Shiur(im) — Torah lesson(s), typically recorded |
| פרשת השבוע | Parashat HaShavua — the weekly Torah portion |
| פרשה / parasha | An individual weekly Torah portion |
| כתבות | Articles |
| מודעות / הודעות | Announcements / notices |
| חנות | Shop |
| הילולה | Hilula — the anniversary of a righteous person's death, marked annually |
| תיקון עולם | Tikkun Olam — rectification of the world; a central Ramhal theme and a book title |
| זוהר | The Zohar — the foundational work of Jewish mysticism |
| אדרא רבא | Idra Rabba — a section of the Zohar; subject of אדיר במרום |
| כולל | Kollel — an institute for full-time advanced Torah study (also the adjective "comprehensive") |
| תשלומים | Instalment payments — a standard and expected option on Israeli credit cards |
| גרשיים | Gershayim — the double-quote mark used in Hebrew acronyms, e.g. רמח״ל |
| דתי לאומי | Dati Leumi — Religious Zionist |
| חרדי | Haredi — strictly Orthodox; the segment least likely to use YouTube |

---

## 12. Reference URLs

**Live properties**
- https://www.ramhal.com/ — Hebrew
- https://www.frramhal.com/ — French
- https://www.enramhal.com/ — English (nominally)
- Sitemaps: `/sitemap.asp?depart_id=367044` on each domain

**Media and related**
- https://www.youtube.com/@ramhalInstit
- http://www.zohar-israel.com/adir.asp — 259 MP3 lessons
- https://unem.academia.edu/MORDEKHAICHRIQUI — 57 academic papers
- https://www.torah-box.com/auteurs/rav-mordekhai-chriqui_74.html
- https://akadem.org/author/mordekhai-chriqui
- https://beithazohar.com/en/speaker/rav-chriqui/

**Legacy / unaffiliated**
- http://www.ramhal.yalla.co.il/store/146931/ — legacy store, broken SSL
- https://kabbale-ramhal-france.jimdofree.com/ — French satellite
- https://ramhal.net/ — **a different organisation, confirmed not affiliated.** Do not treat as a
  source for anything about Machon Ramhal

**Contact details as published**
- Hebrew site: הרב רפאל קצנלבוגן 73, ירושלים · 02-6535101 · 0546-850-857 · ramhalcom@gmail.com ·
  Sun–Thu 09:00–14:00
- French site: 73 Katzenelbogen St, Jerusalem 91431 · +972-2-653-5101 · fax +972-2-651-0821 ·
  ramhal1@bezeqint.net

---

## 13. Brand assets (received 16 September 2026)

**Logo** — an ornate gold-framed roundel: a teal ring carrying "Institut Ramhal" in Latin and
מכון רמח״ל in Hebrew, around a photograph of the Beit Ramhal building, divided by a six-spoke wheel
lettered א ב ג ד ה ו. A gold scroll above reads **40 · 1986–2026 · תשמ״ו–תשפ״ו**.

**Brand colours, sampled from the logo file:**

| Role | Value |
|---|---|
| Teal (primary) | `#00707C` — logo range `#005058`–`#008088` |
| Teal deep | `#004F58` |
| Gold | `#B08D42` for text and rules; logo highlights run `#D8C898`–`#F8E0B0` |

The same teal-and-gold pairing appears in the beit midrash itself — the ark's inscription band and
metalwork — so it is the institute's real material palette, not just a logo choice.

**Photographs supplied** (in `public/`): the Rav teaching at the amud before the ark; a wide view of
the beit midrash full of students; the Rav at close range; the Rav writing. Note `IMG_5791` carries
EXIF rotation that ffmpeg ignores — pass `-autorotate` or correct it before use.
