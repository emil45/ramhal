import { describe, expect, it } from 'vitest'

import {
  assertRestorable,
  findCustomerDataTables,
  findExtensionsInDump,
  findRolesNamedByDump,
  parseRestoreTarget,
  removeNeonOnlyExtensions,
} from '@/lib/localRestore'

describe('assertRestorable', () => {
  it('allows the two local databases', () => {
    expect(() => assertRestorable(parseRestoreTarget('postgresql://localhost:5432/ramhal'))).not.toThrow()
    expect(() => assertRestorable(parseRestoreTarget('postgresql://127.0.0.1/ramhal_test'))).not.toThrow()
  })

  it('refuses a remote host even with an allowed name', () => {
    expect(() => assertRestorable(parseRestoreTarget('postgresql://ep-x.eu-central-1.aws.neon.tech/ramhal'))).toThrow(/not local/)
  })

  it('refuses the system databases by name', () => {
    for (const name of ['postgres', 'template0', 'template1']) {
      expect(() => assertRestorable(parseRestoreTarget(`postgresql://localhost/${name}`))).toThrow(/system database/)
    }
  })

  it('refuses any other database on localhost', () => {
    expect(() => assertRestorable(parseRestoreTarget('postgresql://localhost/somethingelse'))).toThrow(/only ramhal and ramhal_test/)
  })
})

describe('findRolesNamedByDump', () => {
  const dump = [
    'ALTER TABLE public.books OWNER TO neondb_owner;',
    'ALTER SEQUENCE public.x_id_seq OWNER TO neondb_owner;',
    'GRANT SELECT ON TABLE public.books TO readonly_role;',
    'GRANT USAGE ON SCHEMA public TO PUBLIC;',
    'ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser;',
  ].join('\n')

  it('lists each role once, without built-in pseudo-roles', () => {
    expect(findRolesNamedByDump(dump)).toEqual(['cloud_admin', 'neondb_owner', 'readonly_role'])
  })

  it('finds nothing in a dump without ownership', () => {
    expect(findRolesNamedByDump('CREATE TABLE t (id integer);')).toEqual([])
  })
})

describe('removeNeonOnlyExtensions', () => {
  it('removes Neon-only extensions and their comments and keeps the rest', () => {
    const dump = ['CREATE EXTENSION IF NOT EXISTS pg_session_jwt WITH SCHEMA pgrst;', 'COMMENT ON EXTENSION pg_session_jwt IS \'x\';', 'CREATE EXTENSION IF NOT EXISTS pgcrypto;', 'SELECT 1;'].join('\n')
    const result = removeNeonOnlyExtensions(dump)
    expect(result.removed).toEqual(['pg_session_jwt'])
    expect(result.sql).toBe(['CREATE EXTENSION IF NOT EXISTS pgcrypto;', 'SELECT 1;'].join('\n'))
    expect(findExtensionsInDump(result.sql)).toEqual(['pgcrypto'])
  })
})

describe('findCustomerDataTables', () => {
  const tables = ['orders', 'orders_lines', 'orders_lines_details', 'carts', 'books', 'users', 'users_sessions', 'payment_events', 'mock_payment_sessions', 'payload_locked_documents_rels']

  it('takes the roots and everything that references them, transitively', () => {
    const foreignKeys = [
      { childTable: 'orders_lines', parentTable: 'orders' },
      { childTable: 'orders_lines_details', parentTable: 'orders_lines' },
      { childTable: 'orders_lines', parentTable: 'books' },
      { childTable: 'users_sessions', parentTable: 'users' },
    ]
    expect(findCustomerDataTables(tables, foreignKeys)).toEqual([
      'carts',
      'mock_payment_sessions',
      'orders',
      'orders_lines',
      'orders_lines_details',
      'payment_events',
      'users_sessions',
    ])
  })

  it('leaves the catalogue and admin users alone', () => {
    const result = findCustomerDataTables(tables, [{ childTable: 'orders_lines', parentTable: 'books' }])
    expect(result).not.toContain('books')
    expect(result).not.toContain('users')
  })

  it('ignores a root table this schema does not have', () => {
    expect(findCustomerDataTables(['books'], [])).toEqual([])
  })
})
