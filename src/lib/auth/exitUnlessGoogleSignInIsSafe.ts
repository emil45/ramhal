import { readGoogleSignInConfig } from '@/lib/auth/googleSignIn'

/**
 * Stops the process when GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are unset —
 * see exitUnlessPaymentConfigurationIsSafe for why throwing from Next's
 * startup hook is not enough on its own.
 */
export function exitUnlessGoogleSignInIsSafe(): void {
  try {
    readGoogleSignInConfig(process.env)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
