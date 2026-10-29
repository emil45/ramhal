import { LOCALE_CONFIG } from './locale.ts'

// The institute runs on Jerusalem time. The admin list is rendered on the
// server, whose clock zone (UTC on Vercel) is not the editor's.
const INSTITUTE_TIME_ZONE = 'Asia/Jerusalem'

const FORMATTER = new Intl.DateTimeFormat(LOCALE_CONFIG.he.intlTag, {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: INSTITUTE_TIME_ZONE,
})

/** An ISO timestamp as the editor reads a date: "29 באוקטובר 2026 בשעה 23:06", in 24-hour time. */
export function formatAdminDateTime(isoTimestamp: string): string {
  return FORMATTER.format(new Date(isoTimestamp))
}
