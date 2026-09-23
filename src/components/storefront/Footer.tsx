import { Mail, MapPin, Phone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { getContactDetails } from '@/lib/siteSettingsData'
import { cataloguePath, coursesPath, donatePath, localePath, questionsPath } from '@/lib/routes'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { Locale } from '@/lib/locale'

export async function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const contact = await getContactDetails(locale)
  const links = [
    { href: cataloguePath(locale), label: dict.nav.catalogue },
    { href: coursesPath(locale), label: dict.nav.courses },
    { href: questionsPath(locale), label: dict.nav.questions },
    { href: localePath(locale, '/beit-ramhal'), label: dict.nav.beitRamhal },
    { href: localePath(locale, '/ramhal'), label: dict.nav.ramhal },
    { href: localePath(locale, '/rabbi-chriqui'), label: dict.nav.chriqui },
    { href: donatePath(locale), label: dict.nav.donate },
  ]

  return (
    <footer className="mt-auto bg-card">
      {/* The double rule that closes a printed page: thick over thin. */}
      <div aria-hidden className="flex flex-col gap-[3px]">
        <div className="h-[3px] bg-gold" />
        <div className="h-px bg-gold" />
      </div>
      <div className="page-container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1.4fr]">
        <div className="flex items-start gap-4">
          <Image src="/logo.png" alt="" width={362} height={512} className="h-14 w-auto" />
          <div className="flex flex-col gap-1">
            <p className="type-subheading text-teal-deep">{dict.nav.home}</p>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{dict.home.tagline}</p>
          </div>
        </div>

        <nav aria-label={dict.footer.exploreTitle} className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">{dict.footer.exploreTitle}</p>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="w-fit text-sm text-muted-foreground underline-offset-4 hover:text-teal hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>

        <address className="flex flex-col gap-2 text-sm not-italic">
          <p className="font-semibold text-foreground">{dict.footer.contactTitle}</p>
          {contact.address ? (
            <p className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-label={dict.footer.address} />
              <span>{contact.address}</span>
            </p>
          ) : null}
          {contact.phone ? (
            <p className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-gold-ink" aria-label={dict.footer.phone} />
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} dir="ltr" className="text-muted-foreground underline-offset-4 hover:text-teal hover:underline">
                {contact.phone}
              </a>
            </p>
          ) : null}
          {contact.email ? (
            <p className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-gold-ink" aria-label={dict.footer.email} />
              <a href={`mailto:${contact.email}`} dir="ltr" className="text-muted-foreground underline-offset-4 hover:text-teal hover:underline">
                {contact.email}
              </a>
            </p>
          ) : null}
        </address>
      </div>
      <div className="border-t border-border">
        <p className="page-container py-4 text-center text-xs text-muted-foreground">{dict.footer.rights}</p>
      </div>
    </footer>
  )
}
