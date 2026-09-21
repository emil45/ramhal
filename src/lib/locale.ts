import type { Currency } from '@/lib/currency'

// Hebrew at the root, no prefix; English and French prefixed. Adding a
// fourth locale means adding one entry here — see docs/DECISIONS.md §2 and
// src/proxy.ts, which rewrites an unprefixed request onto /he.
export const LOCALES = ['he', 'en', 'fr'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'he'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

type LocaleConfig = {
  /** Currency shown by default in this locale (docs/DECISIONS.md §2, §8). */
  currency: Currency
  direction: 'ltr' | 'rtl'
  /**
   * A representative country for the shipping estimate shown before
   * checkout, when the real destination is still unknown — one per locale's
   * dominant shipping zone (src/lib/shipping.ts, src/seed.ts's zones).
   */
  estimatedShippingCountry: string
  /** BCP 47 tag for Intl formatting (numbers, currency, dates). */
  intlTag: string
  /** Decorative cue only; the adjacent native-language label carries meaning. */
  flag: string
  label: string
  shortLabel: string
}

export const LOCALE_CONFIG: Record<Locale, LocaleConfig> = {
  he: { currency: 'ILS', direction: 'rtl', estimatedShippingCountry: 'IL', flag: '🇮🇱', intlTag: 'he-IL', label: 'עברית', shortLabel: 'עב' },
  en: { currency: 'USD', direction: 'ltr', estimatedShippingCountry: 'US', flag: '🇺🇸', intlTag: 'en-US', label: 'English', shortLabel: 'EN' },
  fr: { currency: 'EUR', direction: 'ltr', estimatedShippingCountry: 'FR', flag: '🇫🇷', intlTag: 'fr-FR', label: 'Français', shortLabel: 'FR' },
}
