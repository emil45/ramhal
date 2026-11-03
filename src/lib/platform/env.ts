/**
 * Reads a required environment variable, failing fast with a clear message
 * instead of letting a missing secret silently become an empty string.
 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. See .env.example.`)
  }
  return value
}
