import { getDashboardSummary } from '../../lib/dashboardData.ts'

import type { AdminViewServerProps } from 'payload'

const CARD_STYLE: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: '4px',
  padding: '1rem 1.25rem',
  background: 'var(--theme-elevation-50)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const GRID_STYLE: React.CSSProperties = { display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '2rem' }

function CountCard({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <a href={href} style={{ ...CARD_STYLE, textDecoration: 'none', color: 'var(--theme-text)' }}>
      <span style={{ fontSize: '2rem', fontWeight: 600, color: count > 0 ? 'var(--theme-warning-650)' : 'var(--theme-text)' }}>{count}</span>
      <span>{label}</span>
    </a>
  )
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      style={{
        border: '1px solid var(--gold)',
        borderRadius: '4px',
        padding: '0.5rem 1rem',
        textDecoration: 'none',
        color: 'var(--theme-text)',
      }}
    >
      + {label}
    </a>
  )
}

/**
 * Replaces Payload's default collection-overview grid entirely (rather than
 * using the newer, still-experimental `admin.dashboard` widget API) — this
 * needs a specific, opinionated Hebrew layout, not a grid of independent
 * widgets. NOT wrapped in `DefaultTemplate` here: Payload's own routing
 * (`@payloadcms/next/dist/views/Root/index.js`) already wraps every
 * `templateType: 'default'` view — dashboard included — in one before
 * rendering this component inside it. Wrapping again produced a doubled
 * nav and header, found by actually loading the page, not by reading the
 * types.
 */
export async function Dashboard(props: AdminViewServerProps) {
  const { payload } = props
  const summary = await getDashboardSummary(payload)

  return (
    <div className="dashboard" style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>מה דורש אותי היום</h1>
        <p style={{ color: 'var(--theme-elevation-600)', marginBottom: '1.5rem' }}>סקירה חיה של מה שממתין לטיפול.</p>

        <div style={GRID_STYLE}>
          <CountCard label="הזמנות ממתינות לתשלום" count={summary.pendingOrderCount} href={summary.pendingOrdersHref} />
          <CountCard label="הזמנות ששולמו וטרם נשלחו" count={summary.outstandingOrderCount} href={summary.outstandingOrdersHref} />
          <CountCard label="ספרים ללא עטיפה" count={summary.booksMissingCover.count} href={summary.booksMissingCover.href} />
          <CountCard label="ספרים ללא מחיר" count={summary.booksMissingPrice.count} href={summary.booksMissingPrice.href} />
          <CountCard label="ספרים ללא תיאור" count={summary.booksMissingDescription.count} href={summary.booksMissingDescription.href} />
        </div>

        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '2rem' }}>
          <section>
            <h2 style={{ marginBottom: '0.75rem' }}>אירועים</h2>
            {summary.events.length === 0 ? (
              <p style={{ color: 'var(--theme-elevation-600)' }}>אין אירועים.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {summary.events.map((event) => (
                  <li key={event.id}>
                    <a href={`/admin/collections/events/${event.id}`} style={{ color: 'var(--theme-text)' }}>
                      {event.displayTitle ?? event.title} — {new Date(event.startsAt).toLocaleDateString('he-IL')}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 style={{ marginBottom: '0.75rem' }}>הודעות</h2>
            {summary.announcements.length === 0 ? (
              <p style={{ color: 'var(--theme-elevation-600)' }}>אין הודעות.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {summary.announcements.map((announcement) => (
                  <li key={announcement.id}>
                    <a href={`/admin/collections/announcements/${announcement.id}`} style={{ color: 'var(--theme-text)' }}>
                      {announcement.displayTitle ?? announcement.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section>
          <h2 style={{ marginBottom: '0.75rem' }}>פעולות מהירות</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <QuickAction label="הודעה חדשה" href="/admin/collections/announcements/create" />
            <QuickAction label="אירוע חדש" href="/admin/collections/events/create" />
            <QuickAction label="ספר חדש" href="/admin/collections/books/create" />
          </div>
        </section>
      </div>
  )
}
