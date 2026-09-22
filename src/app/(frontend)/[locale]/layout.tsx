import { Assistant, David_Libre } from 'next/font/google'
import { notFound } from 'next/navigation'

import { DemoBanner } from '@/components/storefront/DemoBanner'
import { Footer } from '@/components/storefront/Footer'
import { Header } from '@/components/storefront/Header'
import { DirectionProvider } from '@/components/ui/direction'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { isLocale, LOCALE_CONFIG, LOCALES } from '@/lib/locale'

import '@/app/(frontend)/globals.css'

const assistant = Assistant({ subsets: ['hebrew', 'latin'], variable: '--font-sans' })
const davidLibre = David_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-serif',
})

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale)
  const { direction } = LOCALE_CONFIG[locale]

  return (
    <html lang={locale} dir={direction} className={`${assistant.variable} ${davidLibre.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {/* Base UI's popups (the mobile nav sheet) place themselves from this,
            not from the document's dir attribute. */}
        <DirectionProvider direction={direction}>
          <DemoBanner dict={dict} />
          <Header dict={dict} locale={locale} />
          <main className="flex-1">{children}</main>
          <Footer dict={dict} locale={locale} />
        </DirectionProvider>
      </body>
    </html>
  )
}
