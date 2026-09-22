'use client'

import { HeartHandshake, Menu } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { LOCALE_CONFIG, LOCALES } from '@/lib/locale'
import { localePath } from '@/lib/routes'

import type { Locale } from '@/lib/locale'

type MobileNavProps = {
  closeLabel: string
  current: Locale
  donationLink: { href: string; label: string }
  links: { href: string; label: string }[]
  menuLabel: string
}

/** The site's navigation below the `xl` breakpoint. Each link closes the
 * sheet: navigating within the shop keeps this component mounted, so the
 * sheet would otherwise stay open over the page just chosen. */
export function MobileNav({ closeLabel, current, donationLink, links, menuLabel }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label={menuLabel} />}>
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent side="start" closeLabel={closeLabel}>
        <SheetTitle className="type-subheading px-5 pt-5 text-teal-deep">{menuLabel}</SheetTitle>
        <nav className="flex flex-col px-3">
          {links.map((link) => (
            <SheetClose
              key={link.href}
              nativeButton={false}
              render={<Link href={link.href} className="rounded-md px-3 py-3 text-lg text-foreground hover:bg-secondary" />}
            >
              {link.label}
            </SheetClose>
          ))}
          <SheetClose
            nativeButton={false}
            render={
              <Link
                href={donationLink.href}
                className="mt-2 flex items-center gap-3 rounded-md border border-teal bg-paper-deep px-3 py-3 text-lg font-semibold text-teal-deep hover:bg-teal-deep hover:text-paper"
              />
            }
          >
            <HeartHandshake aria-hidden className="size-5" />
            <span>{donationLink.label}</span>
          </SheetClose>
        </nav>
        <div className="px-5">
          <Separator />
        </div>
        <div className="flex flex-col px-3">
          {LOCALES.map((locale) => (
            <SheetClose
              key={locale}
              nativeButton={false}
              render={
                <Link
                  href={localePath(locale, '/')}
                  hrefLang={locale}
                  lang={locale}
                  dir={LOCALE_CONFIG[locale].direction}
                  aria-current={locale === current ? 'page' : undefined}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-base text-muted-foreground hover:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:font-semibold aria-[current=page]:text-teal-deep"
                />
              }
            >
              <span className="text-lg leading-none" aria-hidden>{LOCALE_CONFIG[locale].flag}</span>
              <span>{LOCALE_CONFIG[locale].label}</span>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
