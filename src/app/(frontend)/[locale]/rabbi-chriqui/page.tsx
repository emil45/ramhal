import Image from 'next/image'
import { notFound } from 'next/navigation'

import { SectionHeading } from '@/components/storefront/SectionHeading'
import { isLocale } from '@/lib/locale'

// Short by design — see ramhal/page.tsx's comment; same source and same
// reasoning apply here. Source: docs/PROJECT_CONTEXT.md §1.
const CONTENT = {
  he: {
    title: 'הרב מרדכי שריקי',
    paragraphs: [
      'הרב מרדכי שריקי (גם: שריקי, צריקי, Chriqui) נולד ב-16 באוגוסט 1959 בקזבלנקה, מרוקו. התחנך במרוקו, בצרפת ובקנדה, בעל תואר שני במדעי הדתות מאוניברסיטת קונקורדיה ומחקר דוקטורט בסורבון על הקבלה כמטאפיזיקה. מתגורר בהר נוף, ירושלים.',
      'נחשב לסמכות המובילה בדורנו בכתבי הרמח״ל. הקדיש את חייו להוצאה לאור, לעריכה, לתרגום וללימוד כתבי הרמח״ל. פירושו נושא את השם כתר מרדכי, המבחין את מהדורותיו משל אחרים.',
      'פועל בשלושה תפקידים: עורך כתבי יד ומהדורות ביקורתיות, מתרגם כתבי הרמח״ל לצרפתית, ומחבר מחקרים מקוריים משלו. הוא זה שהקים את מכון רמח״ל בשנת תשמ״ו (1986) — השנה, תשפ״ו (2026), מציינת ארבעים שנה לפעילות המכון.',
    ],
  },
  en: {
    title: 'Rabbi Mordechai Chriqui',
    paragraphs: [
      'Rabbi Mordechai Chriqui (also transliterated Shriki, Tsriki) was born on 16 August 1959 in Casablanca, Morocco. Educated in Morocco, France and Canada, he holds an MA in Religious Sciences from Concordia University, with doctoral research at the Sorbonne on kabbalah as metaphysics. He is based in Har Nof, Jerusalem.',
      'He is widely regarded as the leading contemporary authority on the Ramhal, having devoted his life to publishing, editing, translating and teaching his writings. His own commentary carries the name Keter Mordechai, distinguishing his editions from other publishers’.',
      'He works in three capacities: editor of manuscripts and critical editions, translator of the Ramhal into French, and author of original studies. He founded Machon Ramhal in 1986 — this year, 2026, marks the institute’s fortieth anniversary.',
    ],
  },
  fr: {
    title: 'Rav Mordekhaï Chriqui',
    paragraphs: [
      'Le Rav Mordekhaï Chriqui est né le 16 août 1959 à Casablanca, au Maroc. Formé au Maroc, en France et au Canada, il est titulaire d’une maîtrise en sciences religieuses de l’université Concordia et a mené des recherches doctorales à la Sorbonne sur la kabbale comme métaphysique. Il réside à Har Nof, à Jérusalem.',
      'Il est largement reconnu comme la principale autorité contemporaine sur le Ramhal, ayant consacré sa vie à la publication, à l’édition, à la traduction et à l’enseignement de ses écrits. Son propre commentaire porte le nom de Keter Mordekhaï, distinguant ses éditions de celles des autres éditeurs.',
      'Il agit à trois titres : éditeur de manuscrits et d’éditions critiques, traducteur du Ramhal en français, et auteur d’études originales. Il a fondé l’Institut Ramhal en 1986 — cette année, 2026, marque le quarantième anniversaire de l’institut.',
    ],
  },
} as const

export default async function RabbiChriquiPage({ params }: PageProps<'/[locale]/rabbi-chriqui'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const content = CONTENT[locale]

  return (
    <article className="page-container max-w-3xl py-10">
      <SectionHeading as="h1">{content.title}</SectionHeading>
      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="mx-auto w-44 shrink-0 self-start overflow-hidden rounded-[2px] shadow-[0_1px_2px_rgb(0_0_0/0.16),0_0_0_1px_rgb(0_0_0/0.05)] sm:mx-0 sm:w-56">
          <Image src="/rabbi-chriqui.jpg" alt="" width={480} height={640} className="h-auto w-full object-cover" />
        </div>
        <div className="flex flex-col gap-5 text-lg leading-[1.8]">
          {content.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  )
}
