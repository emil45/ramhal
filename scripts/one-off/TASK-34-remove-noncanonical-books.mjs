#!/usr/bin/env node
// One-time production catalogue correction for TASK-34.
//
// Emanuel designated the five book-category pages on www.ramhal.com as the
// source of truth. A live audit on 23 September 2026 found 62 unique listings,
// each matched by exact legacy URL to one and only one production book. The
// other 34 production books had no www.ramhal.com URL at all; every one came
// only from frramhal.com/enramhal.com catalogue drift and was already flagged
// `absent-from-hebrew`.
//
// Run exactly once against production. The transaction rechecks the complete
// audited identity set, survivor count, references and owned media before it
// deletes anything. Any drift aborts the whole operation.

import pg from 'pg'

const PRODUCTION_DATABASE_HOST = 'ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech'
const EXPECTED_TOTAL_BEFORE = 96
const EXPECTED_TOTAL_AFTER = 62

const EXPECTED_REMOVALS = new Map([
  [26, 'La Voie de D.ieu'],
  [27, 'MAAMAR HA-HOKHMA'],
  [29, 'דברות הרמחל א גאולה - תיקון עולם'],
  [30, 'Les Voies de la Direction divine'],
  [31, 'זוהר תניינא חלק א'],
  [32, 'גילוי מלכותו רה'],
  [33, 'גילוי מלכותו שבועות'],
  [69, 'LA MÉTAPHYSIQUE DE LʼUNITÉ CHEZ LE RAMHAL'],
  [70, 'Tikoun Olam - La Réparation du Monde'],
  [71, 'Lessence de la Torah - Nouveau format'],
  [72, 'Maamar Ha-Gueoula'],
  [76, 'La voix des justes'],
  [81, 'Les Soixante Dix Arrangements Tome 2'],
  [83, 'Les Soixante Dix Arrangements - Nouveau format'],
  [85, 'סידור חול ורח כוונות הרמחל (פורמט קטן) במבצע'],
  [87, 'לשכננו תדרושו'],
  [88, 'Les Soixante Dix Arrangements Tome1'],
  [89, 'la kabbale de la reparation'],
  [90, 'Kalah Pithé Hokhma, ou la Kabbale signifiante'],
  [91, 'תפילות לרמחל פורמט קטן'],
  [92, 'דברות רמחל חא גאולה'],
  [93, 'דברות רמחל חב תפילה'],
  [94, 'דברות רמחל חג אמונה'],
  [95, 'דברות רמחל חד תשובה'],
  [96, 'רזין גניזין'],
  [97, 'ענייני רה ויוהכ'],
  [98, 'מחזור רה עם כוונות הרמחל'],
  [99, 'Maamar Ha-Gueoula Le discours de la délivrance'],
  [100, 'מחזור כוונות רה לרמחל'],
  [104, 'תפילות לרמחל קטן'],
  [105, '1Les Soixante-dix Arrangements'],
  [113, 'דרך ה'],
  [118, 'תשעה באב'],
  [119, 'מחול לצדיקים'],
])

function fail(message) {
  throw new Error(`TASK-34 refused to delete: ${message}`)
}

function isCanonicalLegacyUrl(value) {
  try {
    return new URL(value).hostname === 'www.ramhal.com'
  } catch {
    return false
  }
}

const connectionString = process.env.DATABASE_URI
if (!connectionString) fail('DATABASE_URI is not set')

const connectionUrl = new URL(connectionString)
if (connectionUrl.hostname !== PRODUCTION_DATABASE_HOST) {
  fail(`expected production host ${PRODUCTION_DATABASE_HOST}, got ${connectionUrl.hostname}`)
}

const client = new pg.Client({ connectionString })
await client.connect()

try {
  await client.query('begin')
  await client.query('lock table books in share row exclusive mode')

  const booksResult = await client.query(`
    select b.id,
           b.import_key,
           b.cover_id,
           coalesce(jsonb_agg(distinct lu.url) filter (where lu.url is not null), '[]'::jsonb) as legacy_urls,
           count(distinct gallery.id)::int as gallery_images
    from books b
    left join books_legacy_urls lu on lu._parent_id = b.id
    left join books_gallery gallery on gallery._parent_id = b.id
    group by b.id
    order by b.id
  `)

  if (booksResult.rowCount !== EXPECTED_TOTAL_BEFORE) {
    fail(`expected ${EXPECTED_TOTAL_BEFORE} books before deletion, found ${booksResult.rowCount}`)
  }

  const noncanonical = booksResult.rows.filter(
    (book) => !book.legacy_urls.some(isCanonicalLegacyUrl),
  )
  if (noncanonical.length !== EXPECTED_REMOVALS.size) {
    fail(`expected ${EXPECTED_REMOVALS.size} noncanonical books, found ${noncanonical.length}`)
  }

  for (const book of noncanonical) {
    const expectedImportKey = EXPECTED_REMOVALS.get(book.id)
    if (!expectedImportKey) fail(`unexpected noncanonical book id ${book.id}`)
    if (book.import_key !== expectedImportKey) {
      fail(`book ${book.id} import key changed from "${expectedImportKey}" to "${book.import_key}"`)
    }
    if (book.cover_id !== null || book.gallery_images !== 0) {
      fail(`book ${book.id} owns a cover or gallery image`)
    }
  }

  for (const [id, importKey] of EXPECTED_REMOVALS) {
    if (!noncanonical.some((book) => book.id === id)) {
      fail(`audited book ${id} ("${importKey}") is no longer in the noncanonical set`)
    }
  }

  const removalIds = [...EXPECTED_REMOVALS.keys()]
  const references = await client.query(
    `
      select 'orders_lines' as source, count(*)::int as count from orders_lines where book_id = any($1::int[])
      union all
      select 'carts_items', count(*)::int from carts_items where book_id = any($1::int[])
      union all
      select 'series.related_book_id', count(*)::int from series where related_book_id = any($1::int[])
      union all
      select 'books_rels.parent_id', count(*)::int from books_rels where parent_id = any($1::int[])
    `,
    [removalIds],
  )
  const usedReferences = references.rows.filter((reference) => reference.count !== 0)
  if (usedReferences.length > 0) {
    fail(`references exist: ${JSON.stringify(usedReferences)}`)
  }

  const reviewReasons = await client.query(
    `
      select count(distinct parent_id)::int as count
      from books_review_reasons
      where value = 'absent-from-hebrew' and parent_id = any($1::int[])
    `,
    [removalIds],
  )
  if (reviewReasons.rows[0].count !== EXPECTED_REMOVALS.size) {
    fail('the removal set no longer exactly matches the absent-from-hebrew review set')
  }

  const deleted = await client.query(
    'delete from books where id = any($1::int[]) returning id, import_key',
    [removalIds],
  )
  if (deleted.rowCount !== EXPECTED_REMOVALS.size) {
    fail(`expected to delete ${EXPECTED_REMOVALS.size} books, deleted ${deleted.rowCount}`)
  }

  const finalState = await client.query(`
    select
      (select count(*)::int from books) as books,
      (select count(distinct parent_id)::int from books_review_reasons where value = 'absent-from-hebrew') as absent_from_hebrew,
      (
        select count(*)::int
        from books b
        where not exists (
          select 1 from books_legacy_urls lu
          where lu._parent_id = b.id and lu.url like 'https://www.ramhal.com/%'
        )
      ) as without_canonical_url
  `)
  const final = finalState.rows[0]
  if (
    final.books !== EXPECTED_TOTAL_AFTER ||
    final.absent_from_hebrew !== 0 ||
    final.without_canonical_url !== 0
  ) {
    fail(`unexpected final state ${JSON.stringify(final)}`)
  }

  await client.query('commit')
  console.log(JSON.stringify({ deleted: deleted.rows, final }, null, 2))
} catch (error) {
  await client.query('rollback')
  throw error
} finally {
  await client.end()
}
