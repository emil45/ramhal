import { HeartHandshake } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { CartLink } from '@/components/storefront/CartLink'
import { LocaleSwitcher } from '@/components/storefront/LocaleSwitcher'
import { MobileNav } from '@/components/storefront/MobileNav'
import { buttonVariants } from '@/components/ui/button'
import { cataloguePath, coursesPath, donatePath, localePath, questionsPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { Locale } from '@/lib/locale'

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
      <div className="page-container flex h-16 items-center gap-3 md:h-20 md:gap-6">
        <Link href={localePath(locale, '/')} className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={362} height={512} className="h-12 w-auto md:h-16" priority />
          <span className="font-serif text-xl font-bold text-teal-deep md:text-2xl">{dict.nav.home}</span>
        </Link>

        <nav className="ms-auto hidden items-center gap-1 xl:flex">
          <Link href={cataloguePath(locale)} className={cn(buttonVariants({ size: 'default' }), 'me-2 px-5')}>
            {dict.nav.catalogue}
          </Link>
          {secondaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className={buttonVariants({ variant: 'ghost' })}>
              {link.label}
            </Link>
          ))}
          <Link
            href={donationLink.href}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'ms-2 border-teal bg-paper-deep text-teal-deep hover:bg-teal-deep hover:text-paper',
            )}
          >
            <HeartHandshake aria-hidden className="size-4" />
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
              'size-10 border-teal bg-paper-deep px-0 text-teal-deep hover:bg-teal-deep hover:text-paper sm:w-auto sm:px-3 xl:hidden',
            )}
          >
            <HeartHandshake aria-hidden className="size-4" />
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
