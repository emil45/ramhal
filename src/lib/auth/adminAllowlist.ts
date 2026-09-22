/**
 * Exactly who may ever obtain an admin session — checked on every login
 * path alike (local password, Google, REST /api/users/login) by
 * src/collections/hooks/allowOnlyListedAdmins.ts. Lives in the environment,
 * not a collection: an attacker holding a session must not be able to edit
 * this list, and adding a person must not require a commit.
 *
 * Required with no default. A default of "allow everyone" or "allow no one"
 * are both wrong in different ways — the failure must be loud, at boot, not
 * a silently permissive or silently locked-out deployment.
 */
export function parseAdminAllowedEmails(value: string | undefined): string[] {
  const emails = (value ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)

  if (emails.length === 0) {
    throw new Error('ADMIN_ALLOWED_EMAILS must be set to a comma-separated list of admin emails. See .env.example.')
  }

  return emails
}

export function readAdminAllowedEmails(): string[] {
  return parseAdminAllowedEmails(process.env.ADMIN_ALLOWED_EMAILS)
}

export function isAdminAllowedEmail(email: string, allowedEmails: readonly string[]): boolean {
  return allowedEmails.includes(email.trim().toLowerCase())
}
