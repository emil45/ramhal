import { requireEnv } from '@/lib/env'

/**
 * This app's own public URL — needed to build OAuth redirect URIs, which
 * Google matches against the exact string registered in the Cloud console.
 * No trailing slash, because the OAuth plugin appends a path directly.
 */
export function parseServerUrl(value: string): string {
  if (!/^https?:\/\//.test(value)) {
    throw new Error(`SERVER_URL must start with http:// or https://; got "${value}". See .env.example.`)
  }
  if (value.endsWith('/')) {
    throw new Error(`SERVER_URL must not have a trailing slash; got "${value}". See .env.example.`)
  }
  return value
}

export function readServerUrl(): string {
  return parseServerUrl(requireEnv('SERVER_URL'))
}
