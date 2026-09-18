import Image from 'next/image'
import Link from 'next/link'

import { LocaleSwitcher } from '@/components/storefront/LocaleSwitcher'
import { localePath } from '@/lib/routes'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { Locale } from '@/lib/locale'

export function Header({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={localePath(locale, '/')} className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" priority />
          <span className="font-serif text-lg font-semibold text-teal-deep">{dict.nav.home}</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href={localePath(locale, '/ramhal')} className="text-muted-foreground hover:text-foreground">
            {dict.nav.ramhal}
          </Link>
          <Link href={localePath(locale, '/rabbi-chriqui')} className="text-muted-foreground hover:text-foreground">
            {dict.nav.chriqui}
          </Link>
          <Link href={localePath(locale, '/cart')} className="font-medium text-teal hover:text-teal-deep">
            {dict.nav.cart}
          </Link>
          <LocaleSwitcher current={locale} />
        </nav>
      </div>
    </header>
  )
}
