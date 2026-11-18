import { HeartHandshake } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { CartLink } from '@/components/storefront/CartLink'
import { LocaleSwitcher } from '@/components/storefront/LocaleSwitcher'
import { MobileNav } from '@/components/storefront/MobileNav'
import { NavLinks } from '@/components/storefront/NavLinks'
import { buttonVariants } from '@/components/ui/button'
import { BOOK_SEGMENT, cataloguePath, coursesPath, donatePath, localePath, questionsPath } from '@/lib/locale/routes'
import { cn } from '@/lib/utils'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { NavLink } from '@/components/storefront/NavLinks'
import type { Locale } from '@/lib/locale/locale'

/**
 * A masthead set like a sefer's title page: the institute's emblem and name
 * centred, the visitor's tools (donate on one side, language and cart on the
 * other) at the margins, and the sections in a centred row beneath.
 */
export function Header({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const links: NavLink[] = [
    { href: cataloguePath(locale), label: dict.nav.catalogue, alsoActiveUnder: [localePath(locale, `/${BOOK_SEGMENT[locale]}`)] },
    { href: coursesPath(locale), label: dict.nav.courses },
    { href: questionsPath(locale), label: dict.nav.questions },
    { href: localePath(locale, '/beit-ramhal'), label: dict.nav.beitRamhal },
    { href: localePath(locale, '/ramhal'), label: dict.nav.ramhal },
    { href: localePath(locale, '/rabbi-chriqui'), label: dict.nav.chriqui },
  ]

  return (
    <header className="border-b border-border bg-card">
      <div className="page-container grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-2 md:h-24">
        <div className="flex items-center gap-1 justify-self-start">
          <div className="xl:hidden">
            <MobileNav closeLabel={dict.nav.closeMenu} current={locale} links={links} menuLabel={dict.nav.menu} />
          </div>
          <Link
            href={donatePath(locale)}
            aria-label={dict.nav.donate}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'size-12 px-0 text-base text-teal-deep hover:bg-paper-deep sm:w-auto sm:border sm:border-teal/40 sm:px-4 sm:hover:border-teal',
            )}
          >
            <HeartHandshake aria-hidden className="size-5" />
            <span className="hidden sm:inline">{dict.nav.donate}</span>
          </Link>
        </div>

        <Link href={localePath(locale, '/')} className="flex items-center gap-3 justify-self-center">
          <Image src="/logo.png" alt="" width={362} height={512} className="h-11 w-auto md:h-14" priority />
          <span className="flex flex-col items-start">
            <span className="font-serif text-xl leading-tight font-medium whitespace-nowrap text-teal-deep md:text-[1.75rem]">
              {dict.nav.home}
            </span>
            <span className="hidden text-xs leading-tight text-gold-ink md:block">{dict.home.since}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 justify-self-end">
          <div className="hidden xl:block">
            <LocaleSwitcher current={locale} />
          </div>
          <CartLink href={localePath(locale, '/cart')} locale={locale} />
        </div>
      </div>

      <nav aria-label={dict.nav.menu} className="hidden border-t border-border xl:block">
        <div className="page-container">
          <NavLinks links={links} />
        </div>
      </nav>
    </header>
  )
}
