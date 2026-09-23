// A real server redirect into a Payload-registered route, not a Next.js
// page — an <a> tag, not next/link, is what actually belongs here.
const GOOGLE_AUTHORIZE_PATH = '/api/users/oauth/authorize'

/** Link to the Google OAuth flow — the only way into /admin (docs/DECISIONS.md §10). */
export function GoogleSignInLink() {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <a
        href={GOOGLE_AUTHORIZE_PATH}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '4px',
          padding: '0.75rem 1rem',
          textDecoration: 'none',
          color: 'var(--theme-text)',
          background: 'var(--theme-elevation-0)',
          fontWeight: 600,
        }}
      >
        התחברות עם Google
      </a>
    </div>
  )
}
