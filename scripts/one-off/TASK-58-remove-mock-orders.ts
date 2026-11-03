// Removes every order made with the mock payment provider, with the rows that hang off them:
// payment events, mock payment sessions and carts. Run once before go-live, when the shop held
// test orders only. Orders cannot be deleted in the admin (`delete: () => false`), so this is the
// only way they go.
//
// Dry run by default: prints what would go and changes nothing. `--apply` deletes. Refuses to run
// at all if any order came from a payment provider other than the mock one.
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-58 DATABASE_URI="<production>" \
//     npx vite-node scripts/one-off/TASK-58-remove-mock-orders.ts [--apply]
import { getPayload } from 'payload'

import config from '../../src/payload.config.ts'
import { SKIP_STOREFRONT_REVALIDATION } from '../../src/collections/hooks/revalidateStorefront.ts'
import { parseDatabaseIdentity } from '../../src/lib/diagnostics.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

const MOCK_PROVIDER = 'mock'
const EVERY_ROW = { id: { exists: true } }

async function main() {
  const shouldApply = process.argv.includes('--apply')

  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is not set')
  console.log(`Target database fingerprint ${parseDatabaseIdentity(databaseUri).fingerprint}`)

  const payload = await getPayload({ config })

  const { totalDocs: realOrders } = await payload.count({
    collection: 'orders',
    where: { provider: { not_equals: MOCK_PROVIDER } },
  })
  if (realOrders > 0) throw new Error(`${realOrders} order(s) came from a real payment provider; refusing to delete anything`)

  const collections = ['paymentEvents', 'mockPaymentSessions', 'carts', 'orders'] as const
  for (const collection of collections) {
    const { totalDocs } = await payload.count({ collection })
    console.log(`${shouldApply ? 'deleting' : 'would delete'} ${totalDocs} from ${collection}`)
  }

  if (!shouldApply) {
    console.log('Dry run. Pass --apply to delete.')
    return
  }

  // Payment events point at orders, so they go first.
  for (const collection of collections) {
    await payload.delete({ collection, where: EVERY_ROW, context: SKIP_STOREFRONT_REVALIDATION })
    const { totalDocs } = await payload.count({ collection })
    console.log(`done   ${collection}: ${totalDocs} left`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
