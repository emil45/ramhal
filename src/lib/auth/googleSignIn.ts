export type GoogleSignInConfig = {
  clientId: string
  clientSecret: string
}

const VARIABLE_NAMES = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] as const

/**
 * Google sign-in for the admin panel — required in every environment,
 * local development included. Users.auth.disableLocalStrategy is
 * unconditional (docs/DECISIONS.md §10), so there is no email+password
 * fallback left for an unset pair to fall back to: a deployment missing
 * either variable would boot with a login screen nobody can use.
 */
export function readGoogleSignInConfig(env: Record<string, string | undefined>): GoogleSignInConfig {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env
  const missing = VARIABLE_NAMES.filter((name) => !env[name])

  if (missing.length > 0) {
    throw new Error(`Google sign-in is the only way into /admin and must be configured: ${missing.join(', ')} not set. See .env.example.`)
  }

  return { clientId: GOOGLE_CLIENT_ID as string, clientSecret: GOOGLE_CLIENT_SECRET as string }
}

const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo'

type GoogleUserInfoResponse = {
  email?: unknown
  email_verified?: unknown
  [otherField: string]: unknown
}

/**
 * The only field the site trusts from Google's response, and the only
 * check that makes it trustworthy. The OAuth plugin writes this return
 * value straight onto the user document (payload.update({ data: userInfo })),
 * so anything unmapped here — role included — would pass straight through
 * from a third party's JSON onto an admin account.
 */
export function parseGoogleUserInfo(response: GoogleUserInfoResponse): { email: string } {
  if (response.email_verified !== true) {
    throw new Error('Google sign-in refused: email is not verified.')
  }
  if (typeof response.email !== 'string' || response.email.length === 0) {
    throw new Error('Google sign-in refused: no email in response.')
  }
  return { email: response.email }
}

/** Calls Google's userinfo endpoint and extracts the one trusted field. */
export async function getGoogleUserInfo(accessToken: string): Promise<{ email: string }> {
  const response = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    throw new Error(`Google sign-in refused: userinfo request failed with status ${response.status}.`)
  }
  return parseGoogleUserInfo((await response.json()) as GoogleUserInfoResponse)
}
