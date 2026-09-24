import Link from 'next/link'

import { SectionHeading } from '@/components/storefront/SectionHeading'
import { buttonVariants } from '@/components/ui/button'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { LOCALES } from '@/lib/locale'
import { cataloguePath, localePath } from '@/lib/routes'

// A not-found page is given no route parameters, and reading the address on the
// client would leave the server-rendered page empty. So every language is
// rendered and the stylesheet keeps the one matching <html lang>, which the
// locale layout sets.
const SHOW_ONLY_ON_MATCHING_LANGUAGE = {
  he: '[html:lang(he)_&]:block',
  en: '[html:lang(en)_&]:block',
  fr: '[html:lang(fr)_&]:block',
} as const

export function NotFoundContent() {
  return (
    <div className="page-container py-16">
      {LOCALES.map((locale) => {
        const { nav, notFound } = getDictionary(locale)
        return (
          <section key={locale} className={`hidden ${SHOW_ONLY_ON_MATCHING_LANGUAGE[locale]}`}>
            <SectionHeading as="h1">{notFound.title}</SectionHeading>
            <p className="mb-8 max-w-xl text-lg text-muted-foreground">{notFound.body}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={localePath(locale, '/')} className={buttonVariants({ size: 'lg' })}>
                {notFound.home}
              </Link>
              <Link href={cataloguePath(locale)} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
                {nav.catalogue}
              </Link>
            </div>
          </section>
        )
      })}
    </div>
  )
}
