import { HeartHandshake } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { CartLink } from '@/components/storefront/CartLink'
import { LocaleSwitcher } from '@/components/storefront/LocaleSwitcher'
import { MobileNav } from '@/components/storefront/MobileNav'
import { buttonVariants } from '@/components/ui/button'
import { cataloguePath, coursesPath, donatePath, localePath, questionsPath } from '@/lib/locale/routes'
import { cn } from '@/lib/utils'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { Locale } from '@/lib/locale/locale'

export function Header({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const donationLink = { href: donatePath(locale), label: dict.nav.donate }
  const secondaryLinks = [
    { href: coursesPath(locale), label: dict.nav.courses },
    { href: questionsPath(locale), label: dict.nav.questions },
    { href: localePath(locale, '/beit-ramhal'), label: dict.nav.beitRamhal },
    { href: localePath(locale, '/ramhal'), label: dict.nav.ramhal },
    { href: localePath(locale, '/rabbi-chriqui'), label: dict.nav.chriqui },
  ]

  return (
    <header className="border-b border-border bg-card">
      <div className="page-container flex h-20 items-center gap-3 md:h-24 md:gap-6">
        <Link href={localePath(locale, '/')} className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={362} height={512} className="h-14 w-auto md:h-[4.5rem]" priority />
          <span className="whitespace-nowrap font-serif text-xl font-medium text-teal-deep md:text-2xl">{dict.nav.home}</span>
        </Link>

        <nav className="ms-auto hidden items-center gap-1 xl:flex">
          <Link href={cataloguePath(locale)} className={cn(buttonVariants({ size: 'default' }), 'me-2 px-6 text-base')}>
            {dict.nav.catalogue}
          </Link>
          {secondaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className={cn(buttonVariants({ variant: 'ghost' }), 'px-3 text-base')}>
              {link.label}
            </Link>
          ))}
          <Link
            href={donationLink.href}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'ms-2 border-teal bg-paper-deep px-4 text-base text-teal-deep hover:bg-teal-deep hover:text-paper',
            )}
          >
            <HeartHandshake aria-hidden className="size-5" />
            {donationLink.label}
          </Link>
        </nav>

        <div className="ms-auto flex items-center gap-1 xl:ms-0">
          <div className="hidden xl:block xl:border-s xl:border-border xl:ps-3">
            <LocaleSwitcher current={locale} />
          </div>
          <Link
            href={donationLink.href}
            aria-label={donationLink.label}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'size-12 border-teal bg-paper-deep px-0 text-base text-teal-deep hover:bg-teal-deep hover:text-paper sm:w-auto sm:px-4 xl:hidden',
            )}
          >
            <HeartHandshake aria-hidden className="size-5" />
            <span className="hidden sm:inline">{donationLink.label}</span>
          </Link>
          <CartLink href={localePath(locale, '/cart')} locale={locale} />
          <div className="xl:hidden">
            <MobileNav
              closeLabel={dict.nav.closeMenu}
              current={locale}
              links={[{ href: cataloguePath(locale), label: dict.nav.catalogue }, ...secondaryLinks]}
              menuLabel={dict.nav.menu}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
