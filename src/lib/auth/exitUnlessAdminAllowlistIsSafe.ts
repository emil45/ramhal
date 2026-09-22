import { readAdminAllowedEmails } from '@/lib/auth/adminAllowlist'

/**
 * Stops the process when ADMIN_ALLOWED_EMAILS is unset or empty — see
 * exitUnlessPaymentConfigurationIsSafe for why throwing from Next's startup
 * hook is not enough on its own.
 */
export function exitUnlessAdminAllowlistIsSafe(): void {
  try {
    readAdminAllowedEmails()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
