#!/usr/bin/env node
// Drives src/app/(payload)/api/dev-import/route.ts — see that file for why
// this exists and when to delete it. Starts `next dev`, waits for the route
// to answer, calls it, then shuts the server down.
//
// Usage: node scripts/import-books.mjs
import { spawn } from 'node:child_process'

process.loadEnvFile('.env')

const secret = process.env.DEV_MIGRATE_SECRET
if (!secret) {
  console.error('DEV_MIGRATE_SECRET is not set in .env — see .env.example.')
  process.exit(1)
}

const url = 'http://localhost:3000/api/dev-import'

const server = spawn('node_modules/.bin/next', ['dev'], {
  detached: true,
  stdio: 'inherit',
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
  // 124 books, each up to 3 locale writes plus a find — slower than a single
  // migration call, so a longer deadline than dev-migrate.mjs's.
  const response = await waitForResponse(Date.now() + 300_000)
  const body = await response.json()
  console.log(JSON.stringify(body, null, 2))
  process.exitCode = response.ok ? 0 : 1
} finally {
  shutdown()
}
