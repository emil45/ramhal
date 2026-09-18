#!/usr/bin/env node
// Drives src/app/(payload)/api/dev-generate-types/route.ts — see that file
// for why this exists and when to delete it. Starts `next dev`, waits for
// the route to answer, calls it, then shuts the server down.
//
// Usage: node scripts/dev-generate-types.mjs
import { spawn } from 'node:child_process'

process.loadEnvFile('.env')

const secret = process.env.DEV_MIGRATE_SECRET
if (!secret) {
  console.error('DEV_MIGRATE_SECRET is not set in .env — see .env.example.')
  process.exit(1)
}

const url = 'http://localhost:3000/api/dev-generate-types'

const server = spawn('node_modules/.bin/next', ['dev'], {
  detached: true,
  stdio: 'inherit',
  env: {
    ...process.env,
    // Skips the dev-mode schema push on boot — this route never touches the
    // database, but a push interactively prompting with no TTY would still
    // hang the server before the route could ever answer.
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
