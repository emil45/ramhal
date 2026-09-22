import { describe, expect, it } from 'vitest'

import { GET } from './route'

// Real database and real env (vitest.config.ts's own test.env plus .env) —
// this route reads process.env.DATABASE_URI directly, so there is nothing
// meaningful to mock here.
describe('GET /api/diagnostics', () => {
  it('reports appEnv, the database identity and the latest migration', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.appEnv).toBe('development')
    expect(body.database).toMatchObject({ host: expect.any(String), database: expect.any(String), user: expect.any(String) })
    expect(body.latestMigration).toMatchObject({ name: expect.any(String), appliedAt: expect.any(String) })
  })

  it('never includes the database password, in the host, the response body, or anywhere else', async () => {
    const passwordFromEnv = new URL(process.env.DATABASE_URI ?? '').password
    expect(passwordFromEnv.length).toBeGreaterThan(0) // the assertion below is only meaningful if there IS one

    const response = await GET()
    const raw = await response.text()

    expect(raw).not.toContain(passwordFromEnv)
  })
})
