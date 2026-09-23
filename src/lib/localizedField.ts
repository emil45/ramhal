/**
 * A missing translation must read as absent, never be backfilled — but a
 * document whose only real content
 * is in French or English is not "incomplete," it is a book (or article) that
 * was never written in Hebrew. "Required" for a localized field like a title
 * should mean "exists somewhere," not "exists in whichever locale happens to
 * be open right now." See src/collections/validators/requiredInAtLeastOneLocale.ts,
 * the Payload-facing use of this.
 */
export function hasValueInAnyLocale(valuesByLocale: Record<string, unknown> | null | undefined): boolean {
  if (!valuesByLocale) return false
  return Object.values(valuesByLocale).some((value) => typeof value === 'string' && value.trim().length > 0)
}

// he -> fr -> en: Hebrew first because it is the site's default locale
// (docs/DECISIONS.md §2), then French for the parsha essays and
// French-only
// books, then English.
export const DISPLAY_LOCALE_PRIORITY = ['he', 'fr', 'en'] as const

export type DisplayTitle = { locale: (typeof DISPLAY_LOCALE_PRIORITY)[number]; title: string }

/**
 * Which locale's value to show when a document's title is missing in the
 * admin's own content locale — for DISPLAY only, e.g. list columns and
 * relationship pickers. Never write this back onto the localized field
 * itself.
 */
export function pickDisplayTitle(titlesByLocale: Record<string, unknown> | null | undefined): DisplayTitle | null {
  for (const locale of DISPLAY_LOCALE_PRIORITY) {
    const title = titlesByLocale?.[locale]
    if (typeof title === 'string' && title.trim().length > 0) return { locale, title }
  }
  return null
}
