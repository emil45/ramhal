// The rules behind `npm run db:restore-local` (scripts/db-restore-local.mjs):
// which databases it may overwrite, what a Neon-made dump needs before a plain
// Postgres accepts it, and which tables hold customer data. Kept apart from the
// script so each rule is testable without a database.

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]']
const RESTORABLE_DATABASES = ['ramhal', 'ramhal_test']
const NEVER_RESTORABLE_DATABASES = ['postgres', 'template0', 'template1']

export type RestoreTarget = { host: string; port: string; database: string }

export function parseRestoreTarget(connectionString: string): RestoreTarget {
  const url = new URL(connectionString)
  return { host: url.hostname, port: url.port || '5432', database: url.pathname.replace(/^\//, '') }
}

/** Overwriting the wrong database is unrecoverable, so this is an allow-list on
 * both host and name — and the system databases are named so the refusal says why. */
export function assertRestorable(target: RestoreTarget): void {
  const description = `${target.host}:${target.port}/${target.database}`
  if (NEVER_RESTORABLE_DATABASES.includes(target.database)) {
    throw new Error(`Refusing to restore into "${target.database}": it is a Postgres system database (${description}).`)
  }
  if (!LOCAL_HOSTS.includes(target.host)) {
    throw new Error(`Refusing to restore into ${description}: the host is not local. Only localhost may be overwritten.`)
  }
  if (!RESTORABLE_DATABASES.includes(target.database)) {
    throw new Error(`Refusing to restore into ${description}: only ${RESTORABLE_DATABASES.join(' and ')} may be overwritten.`)
  }
}

// Extensions Neon installs that no other Postgres has. Everything else the dump
// asks for is left in, so a genuinely missing extension fails loudly.
const NEON_ONLY_EXTENSIONS = ['neon', 'neon_utils', 'neon_test_utils', 'pg_session_jwt']

const BUILT_IN_ROLE_NAMES = ['public', 'current_user', 'session_user', 'current_role']

/** Roles a dump refers to as owner, grantee or default-privilege subject. They
 * exist on Neon and not on a fresh cluster; the restore creates them rather than
 * editing ownership out of the dump. */
export function findRolesNamedByDump(dumpSql: string): string[] {
  const roles = new Set<string>()
  for (const match of dumpSql.matchAll(/^ALTER .* OWNER TO ("?[\w]+"?);$/gm)) roles.add(match[1].replaceAll('"', ''))
  for (const match of dumpSql.matchAll(/^(?:GRANT|REVOKE) .* (?:TO|FROM) ("?[\w]+"?)(?: .*)?;$/gm)) roles.add(match[1].replaceAll('"', ''))
  for (const match of dumpSql.matchAll(/^ALTER DEFAULT PRIVILEGES FOR ROLE ("?[\w]+"?)/gm)) roles.add(match[1].replaceAll('"', ''))
  return [...roles].filter((role) => !BUILT_IN_ROLE_NAMES.includes(role.toLowerCase())).sort()
}

export function removeNeonOnlyExtensions(dumpSql: string): { sql: string; removed: string[] } {
  const removed = new Set<string>()
  const kept = dumpSql.split('\n').filter((line) => {
    const match = line.match(/^(?:CREATE EXTENSION (?:IF NOT EXISTS )?|COMMENT ON EXTENSION )"?(\w+)"?/)
    if (!match || !NEON_ONLY_EXTENSIONS.includes(match[1])) return true
    removed.add(match[1])
    return false
  })
  return { sql: kept.join('\n'), removed: [...removed].sort() }
}

export function findExtensionsInDump(dumpSql: string): string[] {
  return [...dumpSql.matchAll(/^CREATE EXTENSION (?:IF NOT EXISTS )?"?(\w+)"?/gm)].map((match) => match[1])
}

export type ForeignKey = { childTable: string; parentTable: string }

// The tables that hold what a customer typed or a payment produced: checkout
// carts, orders, the payment provider's event log and the mock provider's
// sessions. Everything else in the database is the institute's own catalogue.
const CUSTOMER_DATA_ROOT_TABLES = ['carts', 'orders', 'payment_events', 'mock_payment_sessions']
// Payload's per-user login sessions: a copy of production's must not sign
// anyone in locally.
const AUTH_SESSION_TABLES = ['users_sessions']

/** Roots plus every table that references one, transitively, read from the
 * database's own foreign keys — a child table added later is picked up
 * without anyone remembering to list it. */
export function findCustomerDataTables(existingTables: string[], foreignKeys: ForeignKey[]): string[] {
  const found = new Set([...CUSTOMER_DATA_ROOT_TABLES, ...AUTH_SESSION_TABLES].filter((table) => existingTables.includes(table)))
  let grew = true
  while (grew) {
    grew = false
    for (const { childTable, parentTable } of foreignKeys) {
      if (found.has(parentTable) && !found.has(childTable)) {
        found.add(childTable)
        grew = true
      }
    }
  }
  return [...found].sort()
}
