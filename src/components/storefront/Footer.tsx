import { Mail, MapPin, Phone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { SocialIcon } from '@/components/storefront/SocialIcon'
import { getContactDetails, getSocialLinks } from '@/lib/content/siteSettingsData'
import { cataloguePath, coursesPath, donatePath, localePath, questionsPath } from '@/lib/locale/routes'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { Locale } from '@/lib/locale/locale'

export async function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [contact, socialLinks] = await Promise.all([getContactDetails(locale), getSocialLinks(locale)])
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
    <footer className="site-footer">
      <div className="page-container grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="site-footer-brand">
          <Image src="/logo.png" alt="" width={362} height={512} className="h-20 w-auto" />
          <div className="flex flex-col gap-1">
            <p className="font-serif font-medium text-paper">{dict.nav.home}</p>
            <p className="max-w-sm text-base leading-relaxed text-paper/75">{dict.home.tagline}</p>
            <p className="mt-4 text-sm text-paper/60">{dict.home.since}</p>
          </div>
        </div>

        <nav aria-label={dict.footer.exploreTitle} className="grid grid-cols-2 content-start gap-x-6 gap-y-1">
          <p className="col-span-2 mb-1 text-base font-semibold text-paper">{dict.footer.exploreTitle}</p>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="w-fit py-1.5 text-base text-paper/85 underline-offset-4 hover:text-paper hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-6">
          <address className="flex flex-col gap-3 text-base not-italic">
            <p className="text-base font-semibold text-paper">{dict.footer.contactTitle}</p>
            {contact.address ? (
              <p className="flex items-start gap-2 text-paper/85">
                <MapPin className="mt-1 size-5 shrink-0 text-gold" aria-label={dict.footer.address} />
                <span>{contact.address}</span>
              </p>
            ) : null}
            {contact.phone ? (
              <p className="flex items-center gap-2">
                <Phone className="size-5 shrink-0 text-gold" aria-label={dict.footer.phone} />
                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                  dir="ltr"
                  className="py-1 text-paper/85 underline-offset-4 hover:text-paper hover:underline"
                >
                  {contact.phone}
                </a>
              </p>
            ) : null}
            {contact.email ? (
              <p className="flex items-center gap-2">
                <Mail className="size-5 shrink-0 text-gold" aria-label={dict.footer.email} />
                <a
                  href={`mailto:${contact.email}`}
                  dir="ltr"
                  className="py-1 text-paper/85 underline-offset-4 hover:text-paper hover:underline"
                >
                  {contact.email}
                </a>
              </p>
            ) : null}
          </address>

          {socialLinks.length > 0 ? (
            <nav aria-label={dict.footer.socialTitle} className="flex flex-col gap-2">
              <p className="text-base font-semibold text-paper">{dict.footer.socialTitle}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    dir="ltr"
                    className="inline-flex items-center gap-2 py-1.5 text-base text-paper/85 underline-offset-4 hover:text-paper hover:underline"
                  >
                    <SocialIcon platform={link.platform} className="size-5 shrink-0" />
                    <span>{dict.footer.socialPlatforms[link.platform]}</span>
                  </a>
                ))}
              </div>
            </nav>
          ) : null}
        </div>
      </div>
      <div className="border-t border-paper/15">
        <div className="page-container flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-paper/65">
          <p>{dict.footer.rights}</p>
          <Link
            href={localePath(locale, '/privacy')}
            className="py-2 underline-offset-4 hover:text-paper hover:underline"
          >
            {dict.footer.privacyLabel}
          </Link>
        </div>
      </div>
    </footer>
  )
}
