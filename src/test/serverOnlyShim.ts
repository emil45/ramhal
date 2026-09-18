// Next.js resolves the bare specifier "server-only" to an internal stub via
// its own bundler, without it ever being a real package in node_modules —
// see e.g. src/lib/booksData.ts's `import 'server-only'`. Vitest runs
// outside that bundler, so vitest.config.ts aliases the specifier here
// instead: importing it does nothing, which is exactly what it does under
// Next too (it only *throws* when imported from a client bundle, which a
// vitest run never is).
export {}
