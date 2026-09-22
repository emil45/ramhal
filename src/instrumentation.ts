/**
 * Runs once when the server starts, before it serves any request — see
 * exitUnlessPaymentConfigurationIsSafe for why a mock payment provider must
 * never come up in production.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  // `next build` runs with NODE_ENV=production on a developer's machine and in
  // CI, where the mock is legitimately configured; nothing is served then.
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  const { exitUnlessBuildMatchesEnvironment } = await import('./lib/exitUnlessBuildMatchesEnvironment')
  const { exitUnlessPaymentConfigurationIsSafe } = await import(
    './lib/payment/exitUnlessPaymentConfigurationIsSafe'
  )
  const { exitUnlessAdminAllowlistIsSafe } = await import('./lib/auth/exitUnlessAdminAllowlistIsSafe')
  exitUnlessBuildMatchesEnvironment()
  exitUnlessPaymentConfigurationIsSafe()
  exitUnlessAdminAllowlistIsSafe()
}
