'use client'

import { Check, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useSelectedLayoutSegments } from 'next/navigation'

import { LOCALE_CONFIG, LOCALES } from '@/lib/locale/locale'
import { localizedPagePath } from '@/lib/locale/routes'

import type { Locale } from '@/lib/locale/locale'

export function LocaleSwitcher({ current, label }: { current: Locale; label: string }) {
  const currentLocale = LOCALE_CONFIG[current]
  const segments = useSelectedLayoutSegments()

  return (
    <details className="group relative text-base">
      <summary
        aria-label={label}
        className="flex h-12 cursor-pointer list-none items-center gap-1.5 px-2 text-foreground transition-colors hover:text-teal [&::-webkit-details-marker]:hidden"
      >
        <span className="font-semibold">{currentLocale.shortLabel}</span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="absolute end-0 top-[calc(100%+0.5rem)] z-50 min-w-52 rounded-md border border-border bg-popover p-1.5 text-popover-foreground shadow-md">
        {LOCALES.map((locale) => {
          const option = LOCALE_CONFIG[locale]
          const isCurrent = locale === current

          return (
            <Link
              key={locale}
              href={localizedPagePath(current, locale, segments)}
              hrefLang={locale}
              lang={locale}
              dir={option.direction}
              aria-label={option.label}
              aria-current={isCurrent ? 'page' : undefined}
              className="flex items-center gap-3 rounded-sm px-3 py-3 transition-colors hover:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:font-semibold aria-[current=page]:text-teal-deep"
            >
              <span className="text-lg leading-none" aria-hidden>{option.flag}</span>
              <span className="flex-1">{option.label}</span>
              {isCurrent ? <Check className="size-5 text-teal" aria-hidden /> : null}
            </Link>
          )
        })}
      </div>
    </details>
  )
}
