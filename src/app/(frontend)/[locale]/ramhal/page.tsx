import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RamhalArticleLayout } from './RamhalArticleLayout'
import { RamhalSection } from './RamhalSection'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { ArticleBodyBlock } from '@/components/storefront/blocks/ArticleBodyBlock'
import { isLocale } from '@/lib/locale'
import { groupPageSections } from '@/lib/pageSections'
import { getPageBySlug } from '@/lib/pagesData'
import { buildTableOfContents } from '@/lib/tableOfContents'

export async function generateMetadata({ params }: PageProps<'/[locale]/ramhal'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const page = await getPageBySlug('ramhal', locale)
  if (!page) return {}

  const dict = getDictionary(locale)
  return { title: `${page.title} | ${dict.nav.home}`, description: page.metaDescription ?? undefined }
}

export default async function RamhalPage({ params }: PageProps<'/[locale]/ramhal'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const page = await getPageBySlug('ramhal', locale)
  if (!page) notFound()

  const dict = getDictionary(locale)
  const sections = groupPageSections(page.content ?? [])
  const [heroSection, ...articleSections] = sections[0]?.heading === null ? sections : [{ heading: null, body: [] }, ...sections]

  return (
    <RamhalArticleLayout
      contents={buildTableOfContents(articleSections)}
      contentsLabel={dict.pages.tableOfContents}
      eyebrow={page.eyebrow ?? ''}
      introduction={page.lead ?? ''}
      title={page.title ?? ''}
      heroContent={heroSection.body.map((block, index) => (
        <ArticleBodyBlock key={index} block={block as never} />
      ))}
    >
      {articleSections.map((section, index) => (
        <RamhalSection key={section.heading?.heading ?? index} first={index === 0} section={section} />
      ))}
    </RamhalArticleLayout>
  )
}
