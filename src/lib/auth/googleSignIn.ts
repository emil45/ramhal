export type GoogleSignInConfig = {
  clientId: string
  clientSecret: string
}

const VARIABLE_NAMES = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] as const

/**
 * Google sign-in for the admin panel. Unset, the plugin is disabled and
 * email+password is the only way in — right for local development without
 * a Google Cloud client. All or none: a half-configured deployment would
 * otherwise register the plugin's routes with an empty client secret and
 * fail at the first sign-in attempt instead of at boot.
 */
export function readGoogleSignInConfig(env: Record<string, string | undefined>): GoogleSignInConfig | null {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env

  const missing = VARIABLE_NAMES.filter((name) => !env[name])
  if (missing.length === VARIABLE_NAMES.length) return null

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error(`Google sign-in is half-configured: ${missing.join(', ')} not set. Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither. See .env.example.`)
  }

  return { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET }
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
