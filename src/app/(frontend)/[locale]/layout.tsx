import { Frank_Ruhl_Libre, Heebo } from 'next/font/google'
import { notFound } from 'next/navigation'

import { Footer } from '@/components/storefront/Footer'
import { Header } from '@/components/storefront/Header'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { isLocale, LOCALE_CONFIG, LOCALES } from '@/lib/locale'

import '@/app/(frontend)/globals.css'

const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-sans' })
const frankRuhlLibre = Frank_Ruhl_Libre({
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
    <html lang={locale} dir={direction} className={`${heebo.variable} ${frankRuhlLibre.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Header dict={dict} locale={locale} />
        <main className="flex-1">{children}</main>
        <Footer dict={dict} />
      </body>
    </html>
  )
}
