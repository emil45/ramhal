import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { isLocale } from '@/lib/locale'

import { EnglishRamhalArticle } from './EnglishRamhalArticle'
import { FrenchRamhalArticle } from './FrenchRamhalArticle'
import { HebrewRamhalArticle } from './HebrewRamhalArticle'

const PAGE_METADATA = {
  he: {
    title: 'הרמח״ל — חייו ותורתו | מכון רמח״ל',
    description: 'חייו של רבי משה חיים לוצאטו ומבוא בהיר לתורתו: אמונה, הנהגה וגילוי היחוד.',
  },
  en: {
    title: 'The Ramhal — Life and Works | Machon Ramhal',
    description: 'The life, writings and lasting influence of Rabbi Moshe Chaim Luzzatto.',
  },
  fr: {
    title: 'Ramhal — Vie et pensée | Institut Ramhal',
    description: 'La vie, les œuvres et la pensée de Rabbi Moché Haïm Luzzatto.',
  },
} as const satisfies Record<string, Metadata>

export async function generateMetadata({ params }: PageProps<'/[locale]/ramhal'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return PAGE_METADATA[locale]
}

export default async function RamhalPage({ params }: PageProps<'/[locale]/ramhal'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  if (locale === 'he') return <HebrewRamhalArticle />
  if (locale === 'fr') return <FrenchRamhalArticle />
  return <EnglishRamhalArticle />
}
