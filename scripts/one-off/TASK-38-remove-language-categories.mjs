#!/usr/bin/env node
// One-time removal of the three language categories for TASK-38.
//
// hebrew-books/french-books/english-books duplicated books.bookLanguage as a
// category — see docs/DECISIONS.md §24. A read-only audit against both
// databases on 23 September 2026 found no book whose category contradicted
// its bookLanguage and no book with bookLanguage 'unknown'; the per-database
// numbers below are hardcoded from that audit, the way TASK-34 does it.
// Only siddurim-machzorim is a real category (a kind of work, not a
// language) and is kept.
//
// Runs against whichever database DATABASE_URI points at — once against
// development, once against production, as TASK-35 was — and refuses any
// other host. The transaction rechecks the audited category set, the
// per-category counts and the zero-mismatch claim before it changes
// anything; any drift aborts the whole operation.

import pg from 'pg'

const LANGUAGE_CATEGORY_SLUGS = ['hebrew-books', 'french-books', 'english-books']
const EXPECTED_LANGUAGE_BY_SLUG = { 'hebrew-books': 'he', 'french-books': 'fr', 'english-books': 'en' }

const EXPECTATIONS = {
  'ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech': {
    environment: 'production',
    totalBooksBefore: 62,
    categoryCounts: { 'hebrew-books': 45, 'french-books': 9, 'english-books': 2, 'siddurim-machzorim': 6 },
  },
  'ep-orange-bar-b12vlqne-pooler.c-5.eu-central-1.aws.neon.tech': {
    environment: 'development',
    totalBooksBefore: 96,
    categoryCounts: { 'hebrew-books': 61, 'french-books': 24, 'english-books': 2, 'siddurim-machzorim': 9 },
  },
}

function fail(message) {
  throw new Error(`TASK-38 refused to proceed: ${message}`)
}

const connectionString = process.env.DATABASE_URI
if (!connectionString) fail('DATABASE_URI is not set')

const connectionUrl = new URL(connectionString)
const expectations = EXPECTATIONS[connectionUrl.hostname]
if (!expectations) fail(`unrecognised database host ${connectionUrl.hostname} — expected the development or production host`)

const client = new pg.Client({ connectionString })
await client.connect()

try {
  await client.query('begin')
  await client.query('lock table books, categories in share row exclusive mode')

  const totalBooksBefore = await client.query('select count(*)::int as count from books')
  if (totalBooksBefore.rows[0].count !== expectations.totalBooksBefore) {
    fail(`expected ${expectations.totalBooksBefore} books on ${expectations.environment}, found ${totalBooksBefore.rows[0].count}`)
  }

  const categoryRows = await client.query(`
    select c.id, c.slug, count(b.id)::int as book_count
    from categories c
    left join books b on b.category_id = c.id
    group by c.id, c.slug
    order by c.slug
  `)

  const actualCategoryCounts = Object.fromEntries(categoryRows.rows.map((row) => [row.slug, row.book_count]))
  const expectedSlugs = Object.keys(expectations.categoryCounts).sort()
  const actualSlugs = Object.keys(actualCategoryCounts).sort()
  if (JSON.stringify(actualSlugs) !== JSON.stringify(expectedSlugs)) {
    fail(`category set changed on ${expectations.environment}: expected [${expectedSlugs.join(', ')}], found [${actualSlugs.join(', ')}]`)
  }
  for (const slug of expectedSlugs) {
    if (actualCategoryCounts[slug] !== expectations.categoryCounts[slug]) {
      fail(`category ${slug} on ${expectations.environment} expected ${expectations.categoryCounts[slug]} books, found ${actualCategoryCounts[slug]}`)
    }
  }

  const languageCategoryBooks = await client.query(
    `
      select b.id, b.import_key, b.book_language, c.slug as category_slug
      from books b
      join categories c on c.id = b.category_id
      where c.slug = any($1::text[])
    `,
    [LANGUAGE_CATEGORY_SLUGS],
  )
  const mismatches = languageCategoryBooks.rows.filter(
    (book) => book.book_language !== EXPECTED_LANGUAGE_BY_SLUG[book.category_slug],
  )
  if (mismatches.length > 0) {
    fail(`a book's category contradicts its bookLanguage on ${expectations.environment}: ${JSON.stringify(mismatches)}`)
  }

  const languageCategoryIds = categoryRows.rows.filter((row) => LANGUAGE_CATEGORY_SLUGS.includes(row.slug)).map((row) => row.id)
  const expectedClearedCount = LANGUAGE_CATEGORY_SLUGS.reduce((sum, slug) => sum + expectations.categoryCounts[slug], 0)

  // Explicit, not relied on ON DELETE SET NULL below, so this query's own
  // result shows exactly what changed rather than being inferred from the
  // delete's side effect.
  const cleared = await client.query('update books set category_id = null where category_id = any($1::int[]) returning id', [
    languageCategoryIds,
  ])
  if (cleared.rowCount !== expectedClearedCount) {
    fail(`expected to clear category on ${expectedClearedCount} books, cleared ${cleared.rowCount}`)
  }

  const deletedCategories = await client.query('delete from categories where id = any($1::int[]) returning id, slug', [
    languageCategoryIds,
  ])
  if (deletedCategories.rowCount !== LANGUAGE_CATEGORY_SLUGS.length) {
    fail(`expected to delete ${LANGUAGE_CATEGORY_SLUGS.length} categories, deleted ${deletedCategories.rowCount}`)
  }

  const finalState = await client.query(
    `
      select
        (select count(*)::int from books) as total_books,
        (select count(*)::int from categories) as total_categories,
        (select count(*)::int from categories where slug <> 'siddurim-machzorim') as non_siddurim_categories,
        (
          select count(*)::int from books b
          join categories c on c.id = b.category_id
          where c.slug = 'siddurim-machzorim'
        ) as siddurim_books,
        (select count(*)::int from books where category_id = any($1::int[])) as books_referencing_deleted
    `,
    [languageCategoryIds],
  )
  const final = finalState.rows[0]
  if (
    final.total_books !== expectations.totalBooksBefore ||
    final.total_categories !== 1 ||
    final.non_siddurim_categories !== 0 ||
    final.siddurim_books !== expectations.categoryCounts['siddurim-machzorim'] ||
    final.books_referencing_deleted !== 0
  ) {
    fail(`unexpected final state on ${expectations.environment}: ${JSON.stringify(final)}`)
  }

  await client.query('commit')
  console.log(
    JSON.stringify(
      { environment: expectations.environment, clearedCategoryOnBooks: cleared.rowCount, deletedCategories: deletedCategories.rows, final },
      null,
      2,
    ),
  )
} catch (error) {
  await client.query('rollback')
  throw error
} finally {
  await client.end()
}
