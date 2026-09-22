import config from '@payload-config'
import { SignJWT } from 'jose'
import { createHash, randomUUID } from 'node:crypto'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { GET } from './route'

import type { User } from '@/payload-types'

// Real database and real env (vitest.config.ts's own test.env plus .env) —
// this route reads process.env.DATABASE_URI directly, so there is nothing
// meaningful to mock here. "Authenticated" is simulated with a real,
// validly signed session (docs/DECISIONS.md §22) rather than a mock of
// payload.auth — the local (password) login strategy is disabled
// (src/collections/Users.ts), so this is the only way to exercise the real
// verification path in a test.
let adminUser: User
let authToken: string

beforeAll(async () => {
  const payload = await getPayload({ config })
  adminUser = await payload.create({
    collection: 'users',
    data: { email: `diagnostics-test-${randomUUID()}@example.invalid`, role: 'editor' },
  })

  const sessionId = randomUUID()
  await payload.update({
    collection: 'users',
    id: adminUser.id,
    data: { sessions: [{ id: sessionId, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() }] },
  })

  // Payload derives its actual signing key from PAYLOAD_SECRET
  // (`sha256(config.secret).hex.slice(0, 32)`, payload/dist/index.js) rather
  // than using the configured value directly — replicated here so a
  // self-signed test token verifies exactly the way a real session would.
  const signingKey = createHash('sha256').update(payload.config.secret).digest('hex').slice(0, 32)
  authToken = await new SignJWT({ id: adminUser.id, collection: 'users', email: adminUser.email, sid: sessionId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(signingKey))
})

afterAll(async () => {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'users', id: adminUser.id })
})

function anonymousRequest(): Request {
  return new Request('http://localhost/api/diagnostics')
}

function authenticatedRequest(): Request {
  return new Request('http://localhost/api/diagnostics', { headers: { Authorization: `JWT ${authToken}` } })
}

describe('GET /api/diagnostics', () => {
  it('to an anonymous caller, reports appEnv, a database fingerprint and the latest migration', async () => {
    const response = await GET(anonymousRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.appEnv).toBe('development')
    expect(body.database).toEqual({ fingerprint: expect.any(String) })
    expect(body.latestMigration).toMatchObject({ name: expect.any(String), appliedAt: expect.any(String) })
  })

  it('to an anonymous caller, never includes the database host, name or user', async () => {
    const { hostname, pathname, username } = new URL(process.env.DATABASE_URI ?? '')
    const raw = await (await GET(anonymousRequest())).text()

    expect(raw).not.toContain(hostname)
    expect(raw).not.toContain(pathname.replace(/^\//, ''))
    expect(raw).not.toContain(decodeURIComponent(username))
  })

  it('to an authenticated admin session, additionally reports the real database host, name and user', async () => {
    const { hostname, pathname, username } = new URL(process.env.DATABASE_URI ?? '')
    const body = await (await GET(authenticatedRequest())).json()

    expect(body.database).toEqual({
      fingerprint: expect.any(String),
      host: hostname,
      database: pathname.replace(/^\//, ''),
      user: decodeURIComponent(username),
    })
  })

  it('never includes the database password, authenticated or not', async () => {
    const passwordFromEnv = new URL(process.env.DATABASE_URI ?? '').password
    expect(passwordFromEnv.length).toBeGreaterThan(0) // the assertion below is only meaningful if there IS one

    const anonymousRaw = await (await GET(anonymousRequest())).text()
    const authenticatedRaw = await (await GET(authenticatedRequest())).text()

    expect(anonymousRaw).not.toContain(passwordFromEnv)
    expect(authenticatedRaw).not.toContain(passwordFromEnv)
  })

  it('reports the real backup bucket state, and never leaks the reader secret either way', async () => {
    const raw = await (await GET(anonymousRequest())).text()
    const body = JSON.parse(raw)

    // Whichever shape it is — an empty bucket or a real dump present —
    // this asserts the route actually reached the real bucket rather than
    // silently falling back to null (which only means "not configured").
    expect(body.backup).not.toBeNull()
    if ('error' in body.backup) {
      expect(body.backup.error).toEqual(expect.any(String))
    } else {
      expect(body.backup).toMatchObject({ lastSuccessAt: expect.any(String), ageHours: expect.any(Number) })
    }
    expect(raw).not.toContain(process.env.BACKUP_S3_SECRET_ACCESS_KEY)
    expect(raw).not.toContain(process.env.BACKUP_S3_ENDPOINT)
  })
})
