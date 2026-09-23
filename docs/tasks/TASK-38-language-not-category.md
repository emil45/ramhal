# TASK-38 — A book's language is `bookLanguage`, never a category

> Filed as TASK-36 in the original brief. Renumbered to TASK-38: TASK-36 (שו״ת page) and TASK-37
> (press coverage) were already committed by the time this task started. Body below is verbatim
> from the brief, with the task number corrected throughout.

Read AGENTS.md, docs/DECISIONS.md §20–§23 and docs/DESIGN.md ("Covers", "Catalogue browsing")
before starting. Everything below is decided; where something is marked OPEN, raise it, don't guess.

## 0. Preconditions — stop if any fails

- `git status` is clean and `main` equals `origin/main`. TASK-34 and TASK-35 must be fully committed,
  pushed and reported first. If the tree is dirty, stop and tell me; do not stash, do not commit
  someone else's work.
- First commit of this task: save this prompt verbatim as `docs/tasks/TASK-38-language-not-category.md`.

## 1. The problem

Three of the four categories — `hebrew-books`, `french-books`, `english-books` — store the same fact
as `books.bookLanguage`. The importer translates between them in both directions
(`CATEGORY_TO_LANGUAGE`, `LANGUAGE_TO_CATEGORY`). The storefront shows both, so /fr offers
"Livres en hébreu" under Catégorie AND "Hébreu" under Langue. Two fields for one fact drift apart,
and the son has to set both. This is the same kind of bug as the legacy per-currency cloning: one
fact stored twice.

From now on: **language lives only in `bookLanguage`. A category says what kind of work a book is
(its form or genre), never its language.** Today the only real category is `siddurim-machzorim`.

## 2. Decisions

### 2.1 Schema — unchanged
Keep the `categories` collection and the `books.category` relationship exactly as they are (it is
already optional). No Payload migration, no `payload-types.ts` change. If you find you need either,
stop and explain why.

### 2.2 Data — one guarded one-off script
`scripts/one-off/TASK-38-remove-language-categories.mjs`. Match the structure of the existing
one-off scripts: TASK-34's guarded single transaction that aborts on drift, and TASK-35's handling of
running once on development and once on production. Read both first; do not invent a third pattern.

Step 1 — read-only audit, run on both databases, before writing the script. It must report:
- every category (id, slug) and how many books reference each;
- for each of the three language categories, how many of its books have a `bookLanguage` that does
  NOT match it (`hebrew-books`→`he`, `french-books`→`fr`, `english-books`→`en`), listed by id and
  title;
- the number of books with `bookLanguage = 'unknown'`;
- every foreign key that references `categories` (from `information_schema`, not from memory —
  expected: `books.category_id` ON DELETE SET NULL, `categories_locales` and
  `payload_locked_documents_rels` ON DELETE CASCADE).

**If any book's category contradicts its `bookLanguage`, stop and report those books to me.** In that
case the category may be the only correct record of the language, and deleting it would destroy
information. Do not "fix" `bookLanguage` yourself.

Step 2 — the script, with the audited numbers hardcoded as expectations the way TASK-34 does it, in
one transaction:
1. Recheck that the category set and per-category counts equal the audit, and that no mismatch exists.
2. Set `category_id = NULL` explicitly on books in the three language categories. Do this explicitly
   rather than relying on ON DELETE SET NULL, so the script shows exactly what changed.
3. Delete the three category rows (their `categories_locales` rows cascade).
4. Before committing, assert: the total book count is unchanged, only `siddurim-machzorim` remains,
   its book count is unchanged, and no book references a deleted id. Any difference rolls back.

Order: deploy the code changes (§2.3–§2.6) **first**, then run the script on development, then on
production. The code must already work without the language categories before the data loses them.
Commit the script before running it against production, and never edit it afterwards.

### 2.3 Covers — look exactly the same as today
`src/lib/cover.ts` currently picks the frame rule colour from the category slug. Without the language
categories, every French and English cover would silently turn teal. Change the rule to take both the
category and the book's language:
- `siddurim-machzorim` → `var(--gold-ink)`
- otherwise by `bookLanguage`: `he` → `var(--teal)`, `fr` → `var(--gold)`, `en` → `var(--teal-deep)`
- anything else (`he-fr`, `aramaic-fr`, `unknown`, missing) → the existing default

Export one input type from `cover.ts`, with the language typed from the Payload schema
(`Book['bookLanguage']`), not a hand-written union. Use it in `CoverFrame`, `TypographicCover` and
`CoverImage`, replacing their `categorySlug` prop, so the three components do not each declare their
own prop list. Update the four call sites: `ProductCard`, the book page, the courses page and the
cart page. On the cart page, check that the book is populated before reading `bookLanguage`, the same
way it already does for `category`. Rewrite `cover.test.ts` to cover each branch, including the
fallback.
Visual result: identical to today for every book currently in the catalogue.

### 2.4 Importer — legacy shelves give a language, never a category
Legacy breadcrumbs ("ספרים בצרפתית", "Livres en français", …) stay valid **evidence of language**.
They must no longer produce a category.
- Replace `CATEGORY_SLUG` + `CATEGORY_TO_LANGUAGE` with one map from legacy shelf label straight to
  language. Keep discontinued-shelf detection (`cd-dvd`) working.
- Delete `LANGUAGE_TO_CATEGORY` and the fallback that uses it.
- A book's category comes only from `REVIEWED_CATEGORY_SLUG` (the human-reviewed siddurim list).
  Otherwise it is `null`.
- Rewrite the comment on `Books.category` in `src/collections/Books.ts`. It justifies the field in
  terms of language shelves, which is no longer true.
- Tests in `importBooks.test.ts` must cover: a French-shelf book gets `bookLanguage: 'fr'` and
  `categorySlug: null`; a Hebrew-shelf book gets `he` and `null`; a reviewed siddur still gets
  `siddurim-machzorim`; a `cd-dvd` shelf is still skipped.

### 2.5 Seed
Remove the three language entries from `CATEGORIES` in `src/seed.ts` and fix its header comment. The
seed upserts by slug, so leaving them in would bring the categories back.

### 2.6 Storefront catalogue
- The category filter renders **only when the books in the catalogue use at least two distinct
  categories**. Today that means it does not render. It returns by itself if the son adds a second
  real category. Never show a category that no book uses.
- Build the options from the categories already populated on `books`, the same way
  `languagesPresent` is built in `CatalogueClient`, sorted by localized title
  (`localeCompare(…, locale)`). Then `getCategories` in `lib/booksData.ts` and the `categories` prop
  have no remaining purpose, so delete both. No dead code.
- The filter row's grid (`lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]`) must not leave an
  empty column when the category control is absent. Check at sm and lg widths in `he` (RTL) and
  `fr` (LTR).
- shadcn components only; the raw-control grep from AGENTS.md must print nothing.
- No change to `ProductCard`'s metadata line or the book page's `<dl>`: a siddur shows its category,
  other books show their language. Confirm this in the browser, don't assume it.

### 2.7 Admin (Hebrew, for the son)
- `categories` collection: add an `admin.description` along the lines of
  "קטגוריה מתארת את סוג החיבור (למשל: סידורים ומחזורים) — לא את השפה. שפת הספר נקבעת בשדה ׳שפת
  החיבור׳ שבכל ספר." Put a matching short description on the `category` field in Books.
- Books list `defaultColumns`: replace `'category'` with `'bookLanguage'`. Most books will have no
  category, and language is the thing he actually scans for.
- `hebrewLabels.test.ts` must still pass.

### 2.8 Docs
- `docs/DECISIONS.md`: add §24 "Language is a field, not a category". Cover the duplication, the
  rule, why the collection stays, why the filter is conditional, and the audit numbers.
- `docs/DESIGN.md`: in cover anatomy item 2, the rule colour now comes from language plus the siddurim
  category. In "Catalogue browsing", the category filter appears only when there are at least two
  categories to choose between.
- Leave `docs/tasks/TASK-01-payload-setup.md` alone. It is a historical brief.

## 3. Verification — all of it, before the report

- `tsc --noEmit`, `eslint`, `vitest`, `next build` pass before **every** commit.
- `grep -rn "hebrew-books\|french-books\|english-books" src scripts --exclude-dir=out` matches only
  the TASK-38 one-off script and older one-off scripts. Explain anything else.
- In development: screenshots of the catalogue in he, en and fr, desktop and mobile. Show no category
  filter, a clean grid, and cover colours unchanged: compare one French, one English, one Hebrew and
  one siddur cover before and after. Also screenshot the admin categories list with one entry, and
  the Books list showing the language column.
- Production (per AGENTS.md: through the live site, not a database connection alone):
  - `/api/diagnostics` fingerprint matches `docs/RECOVERY.md`;
  - after the one-hour ISR cache has expired or a redeploy has replaced it, the live /fr, /en and
    Hebrew catalogues show no category filter;
  - a siddur's live book page still shows its category;
  - the live catalogue's book count is unchanged.

## 4. Commits (small, in this order)
1. docs: add TASK-38 brief
2. refactor(covers): derive the rule colour from book language, not a language category
3. refactor(import): legacy shelves set the language, never a category
4. feat(storefront): show the category filter only when there are categories to choose between
5. feat(admin): categories describe the kind of work; list shows book language
6. chore(seed): stop seeding language categories
7. feat(data): add TASK-38 one-off, then run it on development, then production
8. docs: DECISIONS §24, DESIGN, TASK-38 report

Push `main` at the end. Report in `docs/reports/TASK-38.md` using the standard four headings.

## 5. Out of scope
- Bilingual books: the language filter matches exactly, so a `he-fr` book appears under neither
  Hebrew nor French. No such book is in the catalogue today. Note it in the report; don't change it.
- Adding new genre categories (קבלה, מוסר, …). **OPEN** for the client. The model already supports
  them, and the filter will appear by itself once a second one is in use.
- Redirects for legacy category-page URLs. None exist today; don't add them here.
