import Link from 'next/link'

import { formatAdminDate } from '../../lib/adminDateTime.ts'
import { getDashboardSummary } from '../../lib/dashboardData.ts'

import type { AdminViewServerProps } from 'payload'

function CountCard({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link href={href} className={count > 0 ? 'dashboard__count dashboard__count--attention' : 'dashboard__count'}>
      <span className="dashboard__count-number">{count}</span>
      <span>{label}</span>
    </Link>
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
 * types. Styles are in admin-theme.css.
 */
export async function Dashboard(props: AdminViewServerProps) {
  const { payload } = props
  const summary = await getDashboardSummary(payload)

  return (
    <div className="dashboard">
      <h1>מה דורש אותי היום</h1>
      <p className="dashboard__intro">סקירה חיה של מה שממתין לטיפול.</p>

      <div className="dashboard__counts">
        <CountCard label="הזמנות ששולמו וטרם נשלחו" count={summary.outstandingOrderCount} href={summary.outstandingOrdersHref} />
        <CountCard label="הזמנות ממתינות לתשלום" count={summary.pendingOrderCount} href={summary.pendingOrdersHref} />
        <CountCard label="ספרים ללא עטיפה" count={summary.booksMissingCover.count} href={summary.booksMissingCover.href} />
        <CountCard label="ספרים ללא מחיר" count={summary.booksMissingPrice.count} href={summary.booksMissingPrice.href} />
        <CountCard label="ספרים ללא תיאור" count={summary.booksMissingDescription.count} href={summary.booksMissingDescription.href} />
      </div>

      <div className="dashboard__columns">
        <section>
          <h2>אירועים</h2>
          {summary.events.length === 0 ? (
            <p className="dashboard__empty">אין אירועים.</p>
          ) : (
            <ul className="dashboard__list">
              {summary.events.map((event) => (
                <li key={event.id}>
                  <Link href={`/admin/collections/events/${event.id}`}>
                    {event.displayTitle ?? event.title} — {formatAdminDate(event.startsAt)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>הודעות</h2>
          {summary.announcements.length === 0 ? (
            <p className="dashboard__empty">אין הודעות.</p>
          ) : (
            <ul className="dashboard__list">
              {summary.announcements.map((announcement) => (
                <li key={announcement.id}>
                  <Link href={`/admin/collections/announcements/${announcement.id}`}>{announcement.displayTitle ?? announcement.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2>פעולות מהירות</h2>
        <div className="dashboard__actions">
          <Link href="/admin/collections/announcements/create">+ הודעה חדשה</Link>
          <Link href="/admin/collections/events/create">+ אירוע חדש</Link>
          <Link href="/admin/collections/books/create">+ ספר חדש</Link>
          <a href="/" target="_blank" rel="noreferrer">צפייה באתר</a>
        </div>
      </section>
    </div>
  )
}
