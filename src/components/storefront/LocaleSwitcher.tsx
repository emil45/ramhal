import { Check, ChevronDown } from 'lucide-react'
import Link from 'next/link'

import { LOCALE_CONFIG, LOCALES } from '@/lib/locale'
import { localePath } from '@/lib/routes'

import type { Locale } from '@/lib/locale'

/**
 * Always switches to the other locale's home page, not the equivalent
 * page — a book's slug differs per locale (localized field), so there is no
 * cheap, honest way to carry "the same book, other language" across a
 * locale switch without fetching that book's other-locale slug first.
 */
export function LocaleSwitcher({ current }: { current: Locale }) {
  const currentLocale = LOCALE_CONFIG[current]

  return (
    <details className="group relative text-sm">
      <summary
        aria-label="Language / שפה / Langue"
        className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-background px-3 text-foreground transition-colors hover:border-teal/40 hover:bg-secondary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden"
      >
        <span className="text-base leading-none" aria-hidden>{currentLocale.flag}</span>
        <span className="font-semibold">{currentLocale.shortLabel}</span>
        <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="absolute end-0 top-[calc(100%+0.5rem)] z-50 min-w-44 rounded-md border border-border bg-popover p-1.5 text-popover-foreground shadow-md">
        {LOCALES.map((locale) => {
          const option = LOCALE_CONFIG[locale]
          const isCurrent = locale === current

          return (
            <Link
              key={locale}
              href={localePath(locale, '/')}
              hrefLang={locale}
              lang={locale}
              dir={option.direction}
              aria-label={option.label}
              aria-current={isCurrent ? 'page' : undefined}
              className="flex items-center gap-3 rounded-sm px-3 py-2.5 transition-colors hover:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:font-semibold aria-[current=page]:text-teal-deep"
            >
              <span className="text-lg leading-none" aria-hidden>{option.flag}</span>
              <span className="flex-1">{option.label}</span>
              {isCurrent ? <Check className="size-4 text-teal" aria-hidden /> : null}
            </Link>
          )
        })}
      </div>
    </details>
  )
}
