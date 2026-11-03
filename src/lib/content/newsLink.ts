const NEWS_LINK_ERROR = 'יש להזין נתיב באתר שמתחיל ב־/ או כתובת מלאה שמתחילה ב־http:// או https://'

export function validateNewsLinkUrl(value: unknown): true | string {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return NEWS_LINK_ERROR

  if (value.startsWith('/') && !value.startsWith('//')) return true
  if (!/^https?:\/\//.test(value)) return NEWS_LINK_ERROR

  try {
    const url = new URL(value)
    return url.hostname ? true : NEWS_LINK_ERROR
  } catch {
    return NEWS_LINK_ERROR
  }
}
