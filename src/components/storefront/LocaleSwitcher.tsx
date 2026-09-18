import Link from 'next/link'

import { LOCALE_CONFIG, LOCALES } from '@/lib/locale'
import { localePath } from '@/lib/routes'

import type { Locale } from '@/lib/locale'

/**
 * Always switches to the other locale's catalogue root, not the equivalent
 * page — a book's slug differs per locale (localized field), so there is no
 * cheap, honest way to carry "the same book, other language" across a
 * locale switch without fetching that book's other-locale slug first. See
 * docs/reports/TASK-06.md.
 */
export function LocaleSwitcher({ current }: { current: Locale }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={localePath(locale, '/')}
          aria-current={locale === current ? 'true' : undefined}
          className={
            locale === current
              ? 'font-semibold text-teal'
              : 'text-muted-foreground hover:text-foreground'
          }
        >
          {LOCALE_CONFIG[locale].label}
        </Link>
      ))}
    </div>
  )
}
