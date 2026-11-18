'use client'

import { Globe, Menu } from 'lucide-react'
import Link from 'next/link'
import { useSelectedLayoutSegments } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { LOCALE_CONFIG, LOCALES } from '@/lib/locale/locale'
import { localizedPagePath } from '@/lib/locale/routes'

import type { Locale } from '@/lib/locale/locale'

type MobileNavProps = {
  closeLabel: string
  current: Locale
  languageLabel: string
  links: { href: string; label: string }[]
  menuLabel: string
}

/** The site's navigation below the `xl` breakpoint. Each link closes the
 * sheet: navigating within the shop keeps this component mounted, so the
 * sheet would otherwise stay open over the page just chosen. */
export function MobileNav({ closeLabel, current, languageLabel, links, menuLabel }: MobileNavProps) {
  const segments = useSelectedLayoutSegments()

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label={menuLabel} />}>
        <Menu className="size-6" aria-hidden />
      </SheetTrigger>
      <SheetContent side="start" closeLabel={closeLabel} className="overflow-y-auto pb-4">
        <SheetTitle className="type-subheading px-5 pt-5 text-teal-deep">{menuLabel}</SheetTitle>
        <p id="mobile-site-language" className="flex items-center gap-2 px-5 text-sm font-medium text-muted-foreground">
          <Globe className="size-4" aria-hidden />
          {languageLabel}
        </p>
        <div role="group" aria-labelledby="mobile-site-language" className="-mt-2 grid grid-cols-3 gap-1 px-3">
          {LOCALES.map((locale) => (
            <SheetClose
              key={locale}
              nativeButton={false}
              render={
                <Link
                  href={localizedPagePath(current, locale, segments)}
                  role="link"
                  hrefLang={locale}
                  lang={locale}
                  dir={LOCALE_CONFIG[locale].direction}
                  aria-current={locale === current ? 'page' : undefined}
                  className="flex min-h-11 items-center justify-center rounded-md px-1 text-center text-base text-foreground hover:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:font-semibold aria-[current=page]:text-teal-deep"
                />
              }
            >
              {LOCALE_CONFIG[locale].label}
            </SheetClose>
          ))}
        </div>
        <div className="px-5">
          <Separator />
        </div>
        <nav className="flex flex-col px-3">
          {links.map((link) => (
            <SheetClose
              key={link.href}
              nativeButton={false}
              render={<Link href={link.href} role="link" className="flex min-h-12 items-center rounded-md px-3 py-2 text-lg text-foreground hover:bg-secondary" />}
            >
              {link.label}
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
