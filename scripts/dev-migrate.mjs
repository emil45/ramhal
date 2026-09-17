#!/usr/bin/env node
// Drives src/app/(payload)/api/dev-migrate/route.ts — see that file for why
// this exists and when to delete it. Starts `next dev`, waits for the route
// to answer, calls it, then shuts the server down.
//
// Usage: node scripts/dev-migrate.mjs create [migrationName]
//        node scripts/dev-migrate.mjs run
import { spawn } from 'node:child_process'

process.loadEnvFile('.env')

const [, , action, migrationName] = process.argv

if (action !== 'create' && action !== 'run') {
  console.error('Usage: dev-migrate.mjs <create [name]|run>')
  process.exit(1)
}

const secret = process.env.DEV_MIGRATE_SECRET
if (!secret) {
  console.error('DEV_MIGRATE_SECRET is not set in .env — see .env.example.')
  process.exit(1)
}

const params = new URLSearchParams({ action })
if (migrationName) params.set('name', migrationName)
const url = `http://localhost:3000/api/dev-migrate?${params}`

const server = spawn('node_modules/.bin/next', ['dev'], {
  detached: true,
  stdio: 'inherit',
  env: {
    ...process.env,
    // Payload's own flag for exactly this: skips the dev-mode schema push
    // that `next dev` normally does on boot, which otherwise marks the
    // database as dev-pushed and makes `migrate()` block on an interactive
    // confirmation prompt that a route handler (no TTY) can never answer.
    PAYLOAD_MIGRATING: 'true',
  },
})

const shutdown = () => {
  if (server.pid) process.kill(-server.pid, 'SIGTERM')
}

async function waitForResponse(deadline) {
  while (Date.now() < deadline) {
    try {
      return await fetch(url, { headers: { 'x-dev-migrate-secret': secret } })
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw new Error(`Timed out waiting for ${url}`)
}

try {
  const response = await waitForResponse(Date.now() + 90_000)
  const body = await response.json()
  console.log(body)
  process.exitCode = response.ok ? 0 : 1
} finally {
  shutdown()
}
