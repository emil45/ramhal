import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import { slugify } from '../lib/slugify.ts'

// Preference order for picking which locale's title backfills a pre-existing
// book's canonical urlSlug, when the book carries more than one. Matches
// src/lib/booksData.ts#bestAcrossLocales's own priority for the default
// viewer (Hebrew first, the project's default locale) — see
// docs/DECISIONS.md §2. There is no record of which locale a given book was
// originally *created* in (src/importBooks.ts's primaryLocale is not
// persisted), so this is the closest honest substitute, not a re-derivation
// of the original import order.
const LOCALE_PREFERENCE = ['he', 'en', 'fr'] as const

// Field names as the query's own column aliases produce them (snake_case,
// matching the raw SQL below) — not camelCase. A previous version of this
// migration cast the query result straight to a camelCase type without
// renaming anything, which silently read every field as undefined and sent
// every pre-existing book down the `book-${id}` fallback path. Caught before
// this migration was committed; see docs/reports/TASK-07.md §A1.
type LocalizedTitleRow = { parent_id: number; _locale: string; title: string | null }

/**
 * Fills the one non-localized `url_slug` column for every book that
 * predates it, deterministically and without touching any book created
 * after this migration ships (those get it from Books.ts's own
 * beforeValidate hook at creation time — see that collection's comment on
 * urlSlug).
 *
 * Four pairs of pre-existing books collapse to the same slug once titles are
 * compared across the whole catalogue rather than per locale (see
 * docs/reports/TASK-07.md §A1) — real "ambiguous-match" duplicates flagged
 * for the son to merge in a future task, not a bug in this backfill. Both
 * members of a pair must stay independently reachable until then, so on a
 * collision the lower book id keeps the bare slug (matching which one the
 * old, buggy cross-locale lookup already happened to resolve to — no URL
 * changes for it) and each later id gets a deterministic `-2`, `-3`, …
 * suffix. A brand new title collision after this migration is a different
 * situation — Books.ts's UNIQUE(url_slug) constraint makes that fail loudly
 * at write time instead, exactly as docs/tasks/TASK-07-storefront.md §A1
 * requires of the import.
 */
async function backfillUrlSlugs(db: MigrateUpArgs['db']): Promise<void> {
  const books = await db.execute<{ id: number }>(sql`SELECT "id" FROM "books" ORDER BY "id" ASC`)
  const titleRows = await db.execute<{ parent_id: number; _locale: string; title: string | null }>(
    sql`SELECT "_parent_id" AS parent_id, "_locale", "title" FROM "books_locales"`,
  )

  const titlesByBook = new Map<number, Record<string, string | null>>()
  for (const row of titleRows.rows as unknown as LocalizedTitleRow[]) {
    const byLocale = titlesByBook.get(row.parent_id) ?? {}
    byLocale[row._locale] = row.title
    titlesByBook.set(row.parent_id, byLocale)
  }

  const assigned = new Set<string>()

  for (const book of books.rows as unknown as { id: number }[]) {
    const titles = titlesByBook.get(book.id) ?? {}
    const title = LOCALE_PREFERENCE.map((locale) => titles[locale]).find((value) => !!value) ?? `book-${book.id}`
    const base = slugify(title) || `book-${book.id}`

    let candidate = base
    let suffix = 2
    while (assigned.has(candidate)) {
      candidate = `${base}-${suffix}`
      suffix += 1
    }
    assigned.add(candidate)

    await db.execute(sql`UPDATE "books" SET "url_slug" = ${candidate} WHERE "id" = ${book.id}`)
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "books" ADD COLUMN "url_slug" varchar;`)
  await backfillUrlSlugs(db)
  await db.execute(sql`
   ALTER TABLE "books" ALTER COLUMN "url_slug" SET NOT NULL;
  CREATE UNIQUE INDEX "books_url_slug_idx" ON "books" USING btree ("url_slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "books_url_slug_idx";
  ALTER TABLE "books" DROP COLUMN "url_slug";`)
}
