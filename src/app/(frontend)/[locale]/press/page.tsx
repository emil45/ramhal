import { notFound, permanentRedirect } from 'next/navigation'

import { isLocale } from '@/lib/locale'
import { localePath } from '@/lib/routes'

export default async function PressPage({ params }: PageProps<'/[locale]/press'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  permanentRedirect(localePath(locale, '/rabbi-chriqui#press'))
}
