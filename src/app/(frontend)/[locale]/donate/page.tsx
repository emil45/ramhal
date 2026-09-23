import { BookOpen, ExternalLink, Globe2, GraduationCap, HeartHandshake } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageImage } from '@/components/storefront/blocks/PageImage'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { readPaypalDonationUrl } from '@/lib/donation'
import { isLocale } from '@/lib/locale'
import { getDonatePhoto } from '@/lib/siteSettingsData'

const CONTENT = {
  he: {
    metadataDescription: 'תמיכה במכון רמח״ל — שותפות בהוצאה לאור, בלימוד ובהפצת תורת הרמח״ל בארץ ובעולם.',
    eyebrow: 'שותפים למפעל של תורה',
    title: 'ממשיכים את אורו של הרמח״ל',
    lead: 'התמיכה שלכם מסייעת למכון רמח״ל להמשיך להוציא לאור, ללמד ולהפיץ את תורת הרמח״ל — מירושלים אל קהילות ולומדים בארץ ובעולם.',
    imageAlt: 'הרב מרדכי שריקי מוסר שיעור בבית רמח״ל',
    imageCaption: 'הרב מרדכי שריקי בשיעור בבית רמח״ל',
    workTitle: 'מה השותפות מחזקת',
    workIntroduction: 'כבר ארבעים שנה מחבר המכון בין הספר, בית המדרש והלומד. התמיכה במכון מסייעת לקיים את שלושת המעגלים האלה יחד.',
    pillars: [
      { title: 'ספרים', description: 'עריכה, תרגום והוצאה לאור של כתבי הרמח״ל ומהדורות כתר מרדכי.' },
      { title: 'לימוד', description: 'בית המדרש, הכולל והשיעורים המעמיקים את הלימוד השיטתי בתורת הרמח״ל.' },
      { title: 'הפצה', description: 'הנגשת הספרים והשיעורים לקהילות וללומדים בישראל, בצרפת וברחבי העולם.' },
    ],
    calloutEyebrow: 'ביחד, לדור הבא',
    calloutTitle: 'היו שותפים בהמשך הדרך',
    calloutBody: 'כל תמיכה מסייעת לשמור על בית חי של לימוד, יצירה והוצאה לאור — ולהעביר את תורת הרמח״ל הלאה.',
    donateAction: 'תרומה באמצעות PayPal',
    paypalNote: 'התשלום מתבצע באתר המאובטח של PayPal.',
    placeholderAction: 'קישור PayPal בקרוב',
    placeholderNote: 'קישור התרומה המאובטח של המכון יתווסף בקרוב. בשלב זה לא ניתן לבצע תשלום מהעמוד.',
  },
  en: {
    metadataDescription: 'Support Machon Ramhal and its work of publishing, teaching and sharing the thought of the Ramhal in Israel and around the world.',
    eyebrow: 'Partners in a living Torah endeavour',
    title: 'Carrying the Ramhal’s light forward',
    lead: 'Your support helps Machon Ramhal continue to publish, teach and share the Ramhal’s thought — from Jerusalem to readers and communities in Israel and around the world.',
    imageAlt: 'Rabbi Mordechai Chriqui delivering a lesson at Beit Ramhal',
    imageCaption: 'Rabbi Mordechai Chriqui teaching at Beit Ramhal',
    workTitle: 'What your partnership strengthens',
    workIntroduction: 'For forty years, the institute has brought books, the beit midrash and learners together. Supporting the institute helps sustain these three connected circles.',
    pillars: [
      { title: 'Books', description: 'Editing, translating and publishing the writings of the Ramhal and the Keter Mordechai editions.' },
      { title: 'Learning', description: 'The beit midrash, kollel and classes devoted to sustained, systematic study of the Ramhal.' },
      { title: 'Reach', description: 'Making books and lessons accessible to communities and learners in Israel, France and around the world.' },
    ],
    calloutEyebrow: 'Together, for the next generation',
    calloutTitle: 'Become part of what comes next',
    calloutBody: 'Every gift helps sustain a living home of study, creation and publishing — and carry the Ramhal’s teaching forward.',
    donateAction: 'Donate with PayPal',
    paypalNote: 'Payment takes place securely on PayPal.',
    placeholderAction: 'PayPal link coming soon',
    placeholderNote: 'The institute’s secure donation link will be added shortly. Payment is not yet available from this page.',
  },
  fr: {
    metadataDescription: 'Soutenir l’Institut Ramhal et son œuvre de publication, d’enseignement et de diffusion de la pensée du Ramhal en Israël et dans le monde.',
    eyebrow: 'Partenaires d’une œuvre de Torah vivante',
    title: 'Transmettre la lumière du Ramhal',
    lead: 'Votre soutien aide l’Institut Ramhal à poursuivre son travail de publication, d’enseignement et de diffusion de la pensée du Ramhal — de Jérusalem vers les lecteurs et les communautés en Israël et dans le monde.',
    imageAlt: 'Le Rav Mordekhaï Chriqui donne un cours à Beit Ramhal',
    imageCaption: 'Le Rav Mordekhaï Chriqui enseigne à Beit Ramhal',
    workTitle: 'Ce que votre soutien fait vivre',
    workIntroduction: 'Depuis quarante ans, l’institut réunit le livre, le beit hamidrach et ceux qui étudient. Le soutenir aide à faire vivre ensemble ces trois dimensions.',
    pillars: [
      { title: 'Livres', description: 'L’édition, la traduction et la publication des écrits du Ramhal et des éditions Keter Mordekhaï.' },
      { title: 'Étude', description: 'Le beit hamidrach, le kollel et les cours consacrés à une étude suivie et méthodique du Ramhal.' },
      { title: 'Transmission', description: 'Rendre les livres et les cours accessibles aux communautés et aux étudiants en Israël, en France et dans le monde.' },
    ],
    calloutEyebrow: 'Ensemble, pour la génération qui vient',
    calloutTitle: 'Prenez part à la suite de cette œuvre',
    calloutBody: 'Chaque don aide à faire vivre une maison d’étude, de création et de publication — et à transmettre plus loin l’enseignement du Ramhal.',
    donateAction: 'Faire un don avec PayPal',
    paypalNote: 'Le paiement s’effectue de manière sécurisée sur PayPal.',
    placeholderAction: 'Lien PayPal bientôt disponible',
    placeholderNote: 'Le lien sécurisé de l’institut sera ajouté prochainement. Aucun paiement n’est encore possible depuis cette page.',
  },
} as const

const PILLAR_ICONS = [BookOpen, GraduationCap, Globe2]

export async function generateMetadata({ params }: PageProps<'/[locale]/donate'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const content = CONTENT[locale]
  return { title: content.title, description: content.metadataDescription }
}

export default async function DonatePage({ params }: PageProps<'/[locale]/donate'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const content = CONTENT[locale]
  const paypalDonationUrl = readPaypalDonationUrl()
  const donatePhoto = await getDonatePhoto(locale)

  return (
    <article>
      <section className="border-b border-border bg-paper-deep">
        <div className="page-container grid items-center gap-10 py-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14 lg:py-16">
          <div className="flex max-w-2xl flex-col items-start gap-5">
            <Badge variant="outline" className="rounded-[2px] border-gold/70 bg-background/60 px-3 text-gold-ink">
              <HeartHandshake aria-hidden className="size-4" />
              {content.eyebrow}
            </Badge>
            <h1 className="type-display">{content.title}</h1>
            <p className="text-xl leading-relaxed sm:text-2xl">{content.lead}</p>
            <span aria-hidden className="h-[3px] w-24 bg-gold" />
          </div>

          {donatePhoto ? (
            <figure className="relative border border-gold bg-background p-2 shadow-[0_14px_40px_rgb(0_79_88/0.10)]">
              <AspectRatio ratio={1600 / 1068} className="overflow-hidden bg-muted">
                <PageImage
                  media={donatePhoto}
                  alt={content.imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 54vw, 100vw"
                  className="object-cover"
                />
              </AspectRatio>
              <figcaption className="px-2 pb-1 pt-3 text-sm text-muted-foreground">{content.imageCaption}</figcaption>
              <span aria-hidden className="absolute end-4 -bottom-1 h-[3px] w-24 bg-gold" />
            </figure>
          ) : null}
        </div>
      </section>

      <section className="page-container py-14 lg:py-16">
        <div className="max-w-3xl">
          <SectionHeading>{content.workTitle}</SectionHeading>
          <p className="text-lg leading-[1.8] text-muted-foreground">{content.workIntroduction}</p>
        </div>

        <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-3">
          {content.pillars.map((pillar, index) => {
            const Icon = PILLAR_ICONS[index]

            return (
              <section key={pillar.title} className="flex flex-col items-start gap-4 bg-card px-6 py-8 lg:px-8 lg:py-10">
                <span className="flex size-11 items-center justify-center rounded-full border border-gold/60 bg-paper-deep text-teal-deep">
                  <Icon aria-hidden className="size-5" />
                </span>
                <h2 className="type-heading">{pillar.title}</h2>
                <p className="leading-relaxed text-muted-foreground">{pillar.description}</p>
              </section>
            )
          })}
        </div>
      </section>

      <section className="border-y border-border bg-paper-deep">
        <div className="page-container py-14 lg:py-16">
          <div className="mx-auto max-w-3xl border border-gold bg-card px-6 py-10 text-center sm:px-10 lg:px-14 lg:py-12">
            <div aria-hidden className="mx-auto mb-6 flex w-24 flex-col gap-[3px]">
              <span className="h-[3px] bg-gold" />
              <span className="h-px bg-gold" />
            </div>
            <p className="mb-2 text-sm font-semibold text-gold-ink">{content.calloutEyebrow}</p>
            <h2 className="type-title">{content.calloutTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{content.calloutBody}</p>

            <div className="mt-8 flex flex-col items-center gap-3">
              {paypalDonationUrl ? (
                <Link
                  href={paypalDonationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: 'lg' })}
                >
                  <HeartHandshake aria-hidden className="size-5" />
                  {content.donateAction}
                  <ExternalLink aria-hidden className="size-4" />
                </Link>
              ) : (
                <Button size="lg" disabled>
                  <HeartHandshake aria-hidden className="size-5" />
                  {content.placeholderAction}
                </Button>
              )}
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {paypalDonationUrl ? content.paypalNote : content.placeholderNote}
              </p>
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}
