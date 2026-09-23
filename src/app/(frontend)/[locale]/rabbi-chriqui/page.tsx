import { Play } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { PressCoverageSection } from '@/components/storefront/PressCoverageSection'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { isLocale } from '@/lib/locale'

const VIDEO_ID = 'heJLjGQZhsY'

const CONTENT = {
  he: {
    metadataDescription: 'הרב מרדכי שריקי, מייסד מכון רמח״ל והסמכות המובילה בדורנו לכתבי הרמח״ל — חייו, מפעלו ושיחה מצולמת בקולו.',
    eyebrow: 'מייסד מכון רמח״ל',
    title: 'הרב מרדכי שריקי',
    lead: 'עורך, מתרגם ומורה שהקדיש את חייו להשבת כתבי הרמח״ל אל מרכז עולם התורה.',
    portraitAlt: 'הרב מרדכי שריקי מלמד לפני ארון הקודש בבית רמח״ל',
    biographyTitle: 'מפעל חיים',
    paragraphs: [
      'הרב מרדכי שריקי (גם: שריקי, צריקי, Chriqui) נולד ב-16 באוגוסט 1959 בקזבלנקה, מרוקו. התחנך במרוקו, בצרפת ובקנדה, בעל תואר שני במדעי הדתות מאוניברסיטת קונקורדיה ומחקר דוקטורט בסורבון על הקבלה כמטאפיזיקה. מתגורר בהר נוף, ירושלים.',
      'נחשב לסמכות המובילה בדורנו בכתבי הרמח״ל. הקדיש את חייו להוצאה לאור, לעריכה, לתרגום וללימוד כתבי הרמח״ל. פירושו נושא את השם כתר מרדכי, המבחין את מהדורותיו משל אחרים.',
      'פועל בשלושה תפקידים: עורך כתבי יד ומהדורות ביקורתיות, מתרגם כתבי הרמח״ל לצרפתית, ומחבר מחקרים מקוריים משלו. הוא זה שהקים את מכון רמח״ל בשנת תשמ״ו (1986) — השנה, תשפ״ו (2026), מציינת ארבעים שנה לפעילות המכון.',
    ],
    videoEyebrow: 'שיחה מצולמת · כאן מורשת',
    videoTitle: 'על הדור של הרמח״ל — בקולו של הרב',
    videoDescription: 'בשיחה אישית מספר הרב שריקי על הדחף שהוביל אותו אל כתבי הרמח״ל ועל המפעל שלא חדל לבנות מאז.',
    videoPlayerTitle: 'שמישהו יעצור אותי — הרב מרדכי שריקי על הדור של הרמח״ל',
    secondImageAlt: 'הרב מרדכי שריקי מדליק נרות חנוכה בבית רמח״ל',
    secondImageCaption: 'הדלקת נרות חנוכה בבית רמח״ל',
    press: {
      title: 'מן העיתונות',
      introduction: 'סיקור נבחר על הרב שריקי, מפעלו להפצת תורת הרמח״ל ובית המדרש שהקים בירושלים.',
      latestLabel: 'הכתבה האחרונה',
      openLabel: 'לקריאת הכתבה',
      opensInNewTabLabel: 'נפתח באתר חיצוני בחלון חדש',
      externalNote: 'הכתבות מתפרסמות באתרים חיצוניים ונפתחות בחלון חדש.',
    },
  },
  en: {
    metadataDescription: 'Rabbi Mordechai Chriqui, founder of Machon Ramhal and a leading contemporary authority on the Ramhal — his life, work and a filmed conversation.',
    eyebrow: 'Founder of Machon Ramhal',
    title: 'Rabbi Mordechai Chriqui',
    lead: 'An editor, translator and teacher who has devoted his life to returning the Ramhal’s writings to the centre of Jewish learning.',
    portraitAlt: 'Rabbi Mordechai Chriqui teaching before the Torah ark at Beit Ramhal',
    biographyTitle: 'A life’s work',
    paragraphs: [
      'Rabbi Mordechai Chriqui (also transliterated Shriki, Tsriki) was born on 16 August 1959 in Casablanca, Morocco. Educated in Morocco, France and Canada, he holds an MA in Religious Sciences from Concordia University, with doctoral research at the Sorbonne on kabbalah as metaphysics. He is based in Har Nof, Jerusalem.',
      'He is widely regarded as the leading contemporary authority on the Ramhal, having devoted his life to publishing, editing, translating and teaching his writings. His own commentary carries the name Keter Mordechai, distinguishing his editions from other publishers’.',
      'He works in three capacities: editor of manuscripts and critical editions, translator of the Ramhal into French, and author of original studies. He founded Machon Ramhal in 1986 — this year, 2026, marks the institute’s fortieth anniversary.',
    ],
    videoEyebrow: 'Filmed conversation · Kan Moreshet',
    videoTitle: 'The Ramhal’s generation — in the Rabbi’s own voice',
    videoDescription: 'In a personal conversation, Rabbi Chriqui describes what drew him to the Ramhal’s writings and the undertaking he has continued to build ever since.',
    videoPlayerTitle: 'Let someone stop me — Rabbi Mordechai Chriqui on the Ramhal’s generation',
    secondImageAlt: 'Rabbi Mordechai Chriqui lighting Hanukkah candles at Beit Ramhal',
    secondImageCaption: 'Lighting Hanukkah candles at Beit Ramhal',
    press: {
      title: 'In the press',
      introduction: 'Selected coverage of Rabbi Chriqui, his work sharing the Ramhal’s teachings, and the Jerusalem beit midrash he founded.',
      latestLabel: 'Latest article',
      openLabel: 'Read the article',
      opensInNewTabLabel: 'Opens an external Hebrew website in a new tab',
      externalNote: 'The original articles are in Hebrew and open on external websites in a new tab.',
    },
  },
  fr: {
    metadataDescription: 'Le Rav Mordekhaï Chriqui, fondateur de l’Institut Ramhal et grande autorité contemporaine sur le Ramhal — sa vie, son œuvre et un entretien filmé.',
    eyebrow: 'Fondateur de l’Institut Ramhal',
    title: 'Rav Mordekhaï Chriqui',
    lead: 'Éditeur, traducteur et enseignant, il a consacré sa vie à rendre aux écrits du Ramhal leur place au cœur de l’étude juive.',
    portraitAlt: 'Le Rav Mordekhaï Chriqui enseigne devant l’arche sainte de Beit Ramhal',
    biographyTitle: 'L’œuvre d’une vie',
    paragraphs: [
      'Le Rav Mordekhaï Chriqui est né le 16 août 1959 à Casablanca, au Maroc. Formé au Maroc, en France et au Canada, il est titulaire d’une maîtrise en sciences religieuses de l’université Concordia et a mené des recherches doctorales à la Sorbonne sur la kabbale comme métaphysique. Il réside à Har Nof, à Jérusalem.',
      'Il est largement reconnu comme la principale autorité contemporaine sur le Ramhal, ayant consacré sa vie à la publication, à l’édition, à la traduction et à l’enseignement de ses écrits. Son propre commentaire porte le nom de Keter Mordekhaï, distinguant ses éditions de celles des autres éditeurs.',
      'Il agit à trois titres : éditeur de manuscrits et d’éditions critiques, traducteur du Ramhal en français, et auteur d’études originales. Il a fondé l’Institut Ramhal en 1986 — cette année, 2026, marque le quarantième anniversaire de l’institut.',
    ],
    videoEyebrow: 'Entretien filmé · Kan Moreshet',
    videoTitle: 'La génération du Ramhal — par la voix du Rav',
    videoDescription: 'Dans un entretien personnel, le Rav Chriqui raconte ce qui l’a conduit vers les écrits du Ramhal et l’œuvre qu’il n’a cessé de bâtir depuis.',
    videoPlayerTitle: 'Que quelqu’un m’arrête — le Rav Mordekhaï Chriqui et la génération du Ramhal',
    secondImageAlt: 'Le Rav Mordekhaï Chriqui allume les lumières de Hanoucca à Beit Ramhal',
    secondImageCaption: 'Allumage des lumières de Hanoucca à Beit Ramhal',
    press: {
      title: 'Dans la presse',
      introduction: 'Une sélection d’articles sur le Rav Chriqui, son œuvre de diffusion de la pensée du Ramhal et le beit midrash qu’il a fondé à Jérusalem.',
      latestLabel: 'Article récent',
      openLabel: 'Lire l’article',
      opensInNewTabLabel: 'Ouvre un site hébreu externe dans un nouvel onglet',
      externalNote: 'Les articles originaux sont en hébreu et s’ouvrent sur des sites externes dans un nouvel onglet.',
    },
  },
} as const

export async function generateMetadata({ params }: PageProps<'/[locale]/rabbi-chriqui'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  return { title: CONTENT[locale].title, description: CONTENT[locale].metadataDescription }
}

export default async function RabbiChriquiPage({ params }: PageProps<'/[locale]/rabbi-chriqui'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const content = CONTENT[locale]

  return (
    <article>
      <section className="border-b border-border bg-paper-deep">
        <div className="page-container grid items-center gap-10 py-10 md:grid-cols-[1fr_0.72fr] md:gap-14 lg:py-16">
          <div className="flex max-w-2xl flex-col items-start gap-5">
            <Badge variant="outline" className="rounded-[2px] border-gold/70 bg-background/60 px-3 text-gold-ink">
              {content.eyebrow}
            </Badge>
            <h1 className="type-display">{content.title}</h1>
            <p className="text-xl leading-relaxed sm:text-2xl">{content.lead}</p>
            <span aria-hidden className="h-[3px] w-24 bg-gold" />
          </div>

          <div className="relative mx-auto w-full max-w-sm border border-gold bg-background p-2 shadow-[0_14px_40px_rgb(0_79_88/0.10)] md:max-w-none">
            <AspectRatio ratio={3 / 4} className="overflow-hidden bg-muted">
              <Image
                src="/rabbi-chriqui/portrait.webp"
                alt={content.portraitAlt}
                fill
                priority
                sizes="(min-width: 768px) 36vw, 90vw"
                className="object-cover"
              />
            </AspectRatio>
            <span aria-hidden className="absolute end-4 -bottom-1 h-[3px] w-24 bg-gold" />
          </div>
        </div>
      </section>

      <section className="page-container py-14 lg:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.46fr] lg:gap-14">
          <div>
            <SectionHeading>{content.biographyTitle}</SectionHeading>
            <div className="flex flex-col gap-5 text-lg leading-[1.8]">
              {content.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <figure className="mx-auto w-full max-w-sm border border-border bg-paper-deep p-2 lg:mt-16 lg:max-w-none">
            <AspectRatio ratio={3 / 4} className="overflow-hidden bg-muted">
              <Image
                src="/rabbi-chriqui/hanukkah-lighting.webp"
                alt={content.secondImageAlt}
                fill
                sizes="(min-width: 1024px) 29vw, 90vw"
                className="object-cover"
              />
            </AspectRatio>
            <figcaption className="px-2 pb-1 pt-3 text-sm text-muted-foreground">{content.secondImageCaption}</figcaption>
          </figure>
        </div>
      </section>

      <section className="border-y border-border bg-paper-deep">
        <div className="page-container py-14 lg:py-16">
          <div className="mb-8 flex max-w-3xl flex-col items-start gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-teal">
              <Play aria-hidden className="size-4 fill-current" />
              {content.videoEyebrow}
            </p>
            <h2 className="type-heading text-teal-deep">{content.videoTitle}</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">{content.videoDescription}</p>
          </div>

          <div className="max-w-5xl">
            <div className="border border-gold bg-background p-2 shadow-[0_14px_40px_rgb(0_79_88/0.10)]">
              <AspectRatio ratio={16 / 9} className="overflow-hidden bg-teal-deep">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0`}
                  title={content.videoPlayerTitle}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="size-full border-0"
                />
              </AspectRatio>
            </div>
          </div>
        </div>
      </section>

      <PressCoverageSection content={content.press} locale={locale} />
    </article>
  )
}
