#!/usr/bin/env vite-node
// RECONSTRUCTION, not the code that ran — see docs/reports/TASK-24.md and
// AGENTS.md's "one-off scripts are kept, not deleted" convention.
//
// TASK-22 repaired the book catalogue directly against production through
// the Neon MCP tools in conversation, one step at a time, each confirmed
// with Emanuel before running — not through a committed script. This file
// rebuilds only the part that can be rebuilt exactly: the four duplicate
// merges, whose surviving/deleted id pairs and rules are stated plainly in
// docs/reports/TASK-22.md ("28→47, 122→121, 124→123, 128→127 ... any real
// price the duplicate held in a currency the surviving record lacked was
// carried over first, and legacy redirect URLs were unioned").
//
// NOT reconstructed: the 21 books whose real Hebrew title was moved into the
// `he` locale and whose misfiled `en`/`fr` duplicate rows were removed. That
// report names a count, not the 21 books themselves, and the current
// database no longer distinguishes "was always correct" from "fixed by this
// task" — there is nothing left to reconstruct that pass from. Read
// docs/reports/TASK-22.md for what it found and why.
//
// Never run again. Kept as a record of what executed against production,
// not as a reusable tool — most of the ids below no longer exist, having
// already been deleted by the run this reconstructs.
import { getPayload } from 'payload'

import config from '../../src/payload.config.ts'

import type { Book } from '../../src/payload-types.ts'

// duplicate → survivor, exactly as docs/reports/TASK-22.md records them.
const DUPLICATE_MERGES: readonly { duplicateId: number; survivorId: number }[] = [
  { duplicateId: 28, survivorId: 47 },
  { duplicateId: 122, survivorId: 121 },
  { duplicateId: 124, survivorId: 123 },
  { duplicateId: 128, survivorId: 127 },
]

const payload = await getPayload({ config })

try {
  for (const { duplicateId, survivorId } of DUPLICATE_MERGES) {
    const [duplicate, survivor] = await Promise.all([
      payload.findByID({ collection: 'books', id: duplicateId, depth: 0 }).catch(() => null),
      payload.findByID({ collection: 'books', id: survivorId, depth: 0 }),
    ])
    if (!duplicate) {
      console.log(`${duplicateId} → ${survivorId}: duplicate already gone, nothing to merge.`)
      continue
    }

    const referencingOrder = await payload.find({
      collection: 'orders',
      where: { 'lines.book': { equals: duplicateId } },
      limit: 1,
    })
    const referencingCart = await payload.find({
      collection: 'carts',
      where: { 'items.book': { equals: duplicateId } },
      limit: 1,
    })
    if (referencingOrder.docs.length > 0 || referencingCart.docs.length > 0) {
      throw new Error(`Refusing to merge book ${duplicateId}: an order or cart still references it.`)
    }

    const survivorCurrencies = new Set(survivor.prices.map((price: Book['prices'][number]) => price.currency))
    const carriedPrices = duplicate.prices.filter((price: Book['prices'][number]) => !survivorCurrencies.has(price.currency))

    const survivorUrls = new Set((survivor.legacyUrls ?? []).map((row: { url: string }) => row.url))
    const carriedUrls = (duplicate.legacyUrls ?? []).filter((row: { url: string }) => !survivorUrls.has(row.url))

    await payload.update({
      collection: 'books',
      id: survivorId,
      data: {
        prices: [...survivor.prices, ...carriedPrices],
        legacyUrls: [...(survivor.legacyUrls ?? []), ...carriedUrls],
      },
    })
    await payload.delete({ collection: 'books', id: duplicateId })
    console.log(`${duplicateId} → ${survivorId}: merged (${carriedPrices.length} price(s), ${carriedUrls.length} URL(s) carried over), duplicate deleted.`)
  }
} finally {
  await payload.destroy()
}

process.exit(0)
