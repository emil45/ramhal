'use client'

import { Menu } from 'lucide-react'
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
  links: { href: string; label: string }[]
  menuLabel: string
}

/** The site's navigation below the `md` breakpoint. Each link closes the
 * sheet: navigating within the shop keeps this component mounted, so the
 * sheet would otherwise stay open over the page just chosen. */
export function MobileNav({ closeLabel, current, links, menuLabel }: MobileNavProps) {
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
                  aria-current={locale === current ? 'true' : undefined}
                  className="rounded-md px-3 py-2.5 text-base text-muted-foreground hover:bg-secondary aria-[current=true]:font-semibold aria-[current=true]:text-teal"
                />
              }
            >
              {LOCALE_CONFIG[locale].label}
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
