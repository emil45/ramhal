# Task 01 — Payload setup and content model

**For:** Claude Code, working in this repo.
**Read first:** `docs/PROJECT_CONTEXT.md` and `docs/DECISIONS.md`. This brief assumes both.
**Status:** dependencies already installed — `payload@3.89.0`, `@payloadcms/next`,
`@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `graphql`, `sharp`. No app code written yet.

The decisions below are settled. Implement them; don't relitigate them. Where something is genuinely
ambiguous it is marked **OPEN** — raise it rather than guessing.

---

## 1. What this task delivers

A running Payload admin at `/admin`, in Hebrew, backed by Postgres, with the full content model
defined and migrations applied. No frontend work. No store checkout. No migration of legacy content.

Done means: `npm run dev`, log in at `/admin`, see the admin in Hebrew, create a book with Hebrew,
English and French values, and see it in the database.

---

## 2. Locales — get this exactly right

```
locales:       ['he', 'en', 'fr']
defaultLocale: 'he'
```

Hebrew is the **root** (`/`), English and French are prefixed (`/en`, `/fr`). Hebrew never gets a
prefix. The scheme must extend to a fourth language without restructuring.

**Fallback is the subtle part.** Payload's `fallback: true` serves the default locale's value when a
translation is missing — which would print Hebrew paragraphs inside the French site. That is wrong
for prose and right for structural data.

- **Prose fields** (descriptions, article bodies, page bodies): `localized: true`, **no fallback**.
  A missing translation must read as absent, so the frontend can omit the item rather than render
  Hebrew to a French reader.
- **Structural fields** (titles used in admin lists, category names): fallback is acceptable.

This matters concretely: the French site has **35 parsha essays that exist only in French**, and nine
Devarim pages that exist and are empty. The model must express "this has no Hebrew version" as a
normal state, not an error.

---

## 3. The distinction the old site got wrong

**The language a book is written in is not the same as the locale a page is viewed in.**

The legacy sites conflated these, which is why the "English" site sells Hebrew books and its English
category is empty. Model them separately:

- `bookLanguage` — a field on the book: `he | fr | en | he-fr | aramaic-fr`
- content locale — Payload's localisation, i.e. which language the *description* is being read in

A French speaker browsing `/fr` must be able to find Hebrew-language books, described in French.

---

## 4. Collections

### `users`
Payload auth. Roles: `admin`, `editor`. Seed one admin. The Rav is **not** a user — his son does all
administration, so design for one real operator with room for a second.

### `media`
Uploads. `alt` localized. Image sizes: thumbnail 400px, card 800px, full 1600px. Storage is local for
now; Cloudflare R2 comes in a later task, so keep the storage adapter swappable.

### `books`
The catalogue. Each book is a **work**, not a SKU — see `DECISIONS.md` §1.

| Field | Type | Notes |
|---|---|---|
| `title` | text, localized | |
| `slug` | text, localized, unique per locale | generate from title, editable |
| `subtitle` | text, localized | the one-line description on the grid |
| `description` | richtext, localized, **no fallback** | |
| `bookLanguage` | select | see §3 |
| `category` | relationship → `categories` | |
| `prices` | array of `{ currency: ILS\|EUR\|USD, amount: number }` | store **minor units (agorot/cents) as integers** — never floats |
| `cover` | upload → media | |
| `gallery` | array of uploads | |
| `inStock` | checkbox, default true | |
| `shippingUnits` | number, default 1 | shipping tiers count items, not weight — a 7-volume set may count as more than 1. **OPEN:** confirm with the client |
| `publishedAt` | date | drives "new books" on the homepage automatically — no manual "featured" flag for anyone to forget to clear |
| `hebrewYear` | text | e.g. תשפ״ו |
| `isbn` | text | |
| `relatedSeries` | relationship → `series`, hasMany | links a book to its recorded shiurim |
| `legacyUrls` | array of text, admin-hidden | every old URL this book was reachable at, for the redirect map |

### `categories`
`title` localized, `slug`. Seed: ספרים בעברית · ספרים בצרפתית · ספרים באנגלית · סידורים ומחזורים · CD/DVD.

### `series`
A course of shiurim on one work.

`title` localized · `description` localized · `language` (`he | fr`) · `relatedBook` → books ·
`youtubePlaylistId` · `order`.

### `lessons`
One shiur. Populated by a sync job in a later task; define the shape now.

`title` · `series` → series · `youtubeId` · `audioKey` (object-storage key, nullable) ·
`recordedAt` date · `language` · `durationSeconds` · `sourceUpdatedAt` (for idempotent sync).

**Never store video or audio in Postgres.** YouTube hosts the video; audio lands in object storage.

### `articles`
Teaching content — the Hebrew holiday articles and the French parsha essays.

`title` localized · `body` richtext localized **no fallback** · `type` (`parsha | holiday | general`) ·
`parsha` select (the 54 parshiyot, nullable) · `holiday` select (nullable) · `publishedAt` ·
`legacyUrls`.

A parsha article with only a French body is **normal**, not broken.

### `pages`
Institutional pages: about the institute, Beit Ramhal, contact, donations.
`title` localized · `body` richtext localized · `slug` · `legacyUrls`.

### `announcements`
`title` localized · `body` richtext localized · `startsAt` · `endsAt` (nullable).

**Anything dated expires itself.** Queries must filter on `endsAt`. A stale "coming soon" notice is
the commonest way an institute site announces that nobody is home.

### `events`
One-off events — a hilula, a seminar. `title` · `description` · `startsAt` · `endsAt` · `location`.

Recurring shiurim are **not** events. They live in the schedule global. These look alike on the page
and are nothing alike in the admin; modelling them as one thing is a mistake that shows up in six
months.

---

## 5. Globals

### `schedule`
The standing timetable, currently hardcoded into every legacy page.

- `shiurim`: array of `{ title (localized), days (localized text, e.g. "א׳–ה׳"), time (text — "בין מנחה לערבית" is a valid time here, so this is not a time field) }`
- `prayers`: array of `{ name (localized), time (text — "נץ החמה" is a valid value) }`

Seed with the real values: דרך ה׳ א׳–ה׳ בין מנחה לערבית · אדיר במרום יום ג׳ 20:30 ·
תיקונים חדשים יום ה׳ 21:00 · שחרית נץ החמה · מנחה 19:00 · ערבית 20:00.

### `shippingSettings`
The shipping rules engine, editable by the son. Payload's ecommerce plugin ships **no shipping logic
at all** — verified. This is ours.

```ts
zones: [{
  name: string                  // "ישראל", "אירופה", "שאר העולם"
  countries: string[]           // ISO codes; one zone flagged as the fallback
  currency: 'ILS' | 'EUR' | 'USD'
  tiers: [{ minUnits: number, amount: number }]   // ascending; the matching tier is the highest minUnits <= cart units
  freeAboveUnits: number | null                   // free shipping at or above this many units
  allowPickup: boolean                            // Israel only, free
}]
```

Seed from today's live values: Israel ₪30 with free self-pickup, Europe €50, rest of world $86 — and
free shipping above 10 units everywhere.

**Keep the calculation in one pure function** (`lib/shipping.ts`), taking cart units and a destination
and returning a cost, with unit tests. It will be read by a stranger in three years.

### `siteSettings`
Contact details, social links, the currency shown per locale.

---

## 6. Brand tokens

From the logo file, sampled not guessed:

```
--teal:      #00707C     (range #005058–#008088)
--teal-deep: #004F58
--gold:      #B08D42     (highlights #D8C898–#F8E0B0)
```

Not needed for this task. Recorded so the admin theme and the frontend agree later.

---

## 7. Constraints

- **RTL-first.** Hebrew is the default, so any CSS uses logical properties — `margin-inline-start`,
  never `margin-left`. English and French then fall out for free. Retrofitting RTL is where this
  goes wrong.
- **Money as integers in minor units.** Never floats.
- **`legacyUrls` on everything public-facing.** The 301 map depends on it, and retrofitting it after
  the migration means re-deriving mappings that were free at import time.
- **Next.js 16.3.4** — `AGENTS.md` warns this differs from training data. Read
  `node_modules/next/dist/docs/` before writing routing or config code.
- Payload's admin ships Hebrew (`he.js`, 44 languages). Set it; don't translate anything by hand.

---

## 8. Definition of done

1. `npm run dev` starts cleanly
2. `/admin` loads **in Hebrew**, RTL, no layout breakage
3. A book can be created with he/en/fr values and prices in three currencies
4. An article can be created with **only** a French body, and that is not an error
5. Migrations are committed
6. `lib/shipping.ts` exists as a pure function with tests covering: below tier, at a tier boundary,
   above the free threshold, and an unknown country falling back to the default zone
7. `.env.example` lists every variable; no secret is committed

---

## 9. Report back

- Anything in §4 that felt wrong when you implemented it — the model is cheap to change now and
  expensive after the migration
- Whether the Hebrew admin is genuinely usable, with a screenshot. This is the gate: if it is
  unpleasant, we need to know in week one, not month three
- The two **OPEN** items: `shippingUnits` for multi-volume sets, and whether a fourth locale is
  actually foreseen
