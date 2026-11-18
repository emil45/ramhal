import { HeartHandshake } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { CartLink } from '@/components/storefront/CartLink'
import { LocaleSwitcher } from '@/components/storefront/LocaleSwitcher'
import { MobileNav } from '@/components/storefront/MobileNav'
import { NavLinks } from '@/components/storefront/NavLinks'
import { buttonVariants } from '@/components/ui/button'
import {
  BOOK_SEGMENT,
  cataloguePath,
  coursesPath,
  donatePath,
  localePath,
  questionsPath,
} from '@/lib/locale/routes'
import { cn } from '@/lib/utils'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { NavLink } from '@/components/storefront/NavLinks'
import type { Locale } from '@/lib/locale/locale'

export function Header({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const links: NavLink[] = [
    {
      href: cataloguePath(locale),
      label: dict.nav.catalogue,
      alsoActiveUnder: [localePath(locale, `/${BOOK_SEGMENT[locale]}`)],
    },
    { href: coursesPath(locale), label: dict.nav.courses },
    { href: questionsPath(locale), label: dict.nav.questions },
    { href: localePath(locale, '/beit-ramhal'), label: dict.nav.beitRamhal },
    { href: localePath(locale, '/ramhal'), label: dict.nav.ramhal },
    { href: localePath(locale, '/rabbi-chriqui'), label: dict.nav.chriqui },
  ]

  return (
    <header className="site-header">
      <div className="page-container flex min-h-20 items-center justify-between gap-1 sm:gap-4 xl:min-h-24 xl:gap-7">
        <div className="flex flex-1 xl:hidden">
          <MobileNav
            closeLabel={dict.nav.closeMenu}
            current={locale}
            links={[...links, { href: donatePath(locale), label: dict.nav.donate }]}
            menuLabel={dict.nav.menu}
          />
        </div>
        <Link href={localePath(locale, '/')} className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Image
            src="/logo.png"
            alt=""
            width={362}
            height={512}
            className="h-8 w-auto min-[380px]:h-10 sm:h-12 xl:h-14"
            priority
          />
          <span className="flex flex-col items-start">
            <span className="font-serif text-lg leading-tight min-[380px]:text-xl sm:text-2xl font-medium whitespace-nowrap text-teal-deep xl:text-[1.8rem]">
              {dict.nav.home}
            </span>
            <span className="hidden text-xs leading-relaxed text-muted-foreground xl:block">
              {dict.home.brandLine}
            </span>
          </span>
        </Link>

        <nav aria-label={dict.nav.menu} className="hidden flex-1 xl:block">
          <NavLinks links={links} />
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1 xl:flex-none xl:gap-2">
          <div className="hidden xl:block">
            <LocaleSwitcher current={locale} />
          </div>
          <CartLink href={localePath(locale, '/cart')} locale={locale} />
          <Link
            href={donatePath(locale)}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'hidden border-teal/25 bg-transparent px-4 xl:inline-flex',
            )}
          >
            <HeartHandshake aria-hidden className="size-4" />
            {dict.nav.donate}
          </Link>
        </div>
      </div>
    </header>
  )
}
