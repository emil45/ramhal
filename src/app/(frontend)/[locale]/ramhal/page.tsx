import { notFound } from 'next/navigation'

import { isLocale } from '@/lib/locale'

// Short by design — someone deciding whether to buy מסילת ישרים wants
// thirty seconds, not an essay (docs/tasks/TASK-06-storefront.md §4).
// Source: docs/PROJECT_CONTEXT.md §1. Not Payload-backed: two short, rarely
// -changing pages don't earn a CMS content model yet — see docs/reports/TASK-06.md.
const CONTENT = {
  he: {
    title: 'הרמח״ל — רבי משה חיים לוצאטו',
    paragraphs: [
      'רבי משה חיים לוצאטו (תס״ז–תק״ז / 1707–1746), המוכר בראשי התיבות רמח״ל, נולד בגטו היהודי של פדובה שבאיטליה. מקובל, פילוסוף, איש מוסר ומחזאי, הנחשב לאחד המוחות השיטתיים ביותר במחשבת ישראל.',
      'בגיל כעשרים דיווח על גילוי מגיד — קול פנימי — שעורר התנגדות עזה מצד הרבנות בת זמנו. חלק גדול מכתביו נאסר, הוסתר או אבד בימי חייו. נפטר בעכו בגיל 39 בלבד.',
      'כתביו — מסילת ישרים, דעת תבונות, דרך ה׳, קל״ח פתחי חכמה, אדיר במרום, מאמר הגאולה ועוד — הם מיסודות עולם התורה עד ימינו. הכרתו כגאון בעולם התורה באה ברובה לאחר מותו, ועבודת מכון רמח״ל בהוצאת כתביו נתפסת כתיקון אותו עוול.',
    ],
  },
  en: {
    title: 'The Ramhal — Rabbi Moshe Chaim Luzzatto',
    paragraphs: [
      'Rabbi Moshe Chaim Luzzatto (1707–1746), known by the acronym Ramhal, was born in the Jewish ghetto of Padua, Italy — a kabbalist, philosopher, ethicist and playwright regarded as one of the most systematic minds in Jewish thought.',
      'At around twenty he reported receiving a maggid, an inner revelatory voice, which drew intense opposition from the rabbinic establishment of his day. Much of his writing was suppressed, banned or lost during his lifetime. He died in Acre at 39.',
      'His works — Mesillat Yesharim, Daat Tevunot, Derech Hashem, Kalach Pitchei Chochma, Adir BaMarom, Maamar HaGeulah and more — are foundational across the Jewish world. He was recognised as a genius largely only after his death, and the institute’s work of publishing him is understood as a rectification of that neglect.',
    ],
  },
  fr: {
    title: 'Le Ramhal — Rabbi Moshe Haïm Luzzatto',
    paragraphs: [
      'Rabbi Moshe Haïm Luzzatto (1707–1746), connu sous l’acronyme Ramhal, est né dans le ghetto juif de Padoue, en Italie — kabbaliste, philosophe, moraliste et dramaturge, considéré comme l’un des esprits les plus systématiques de la pensée juive.',
      'Vers l’âge de vingt ans, il rapporte avoir reçu un maguid, une voix intérieure révélatrice, qui suscite une opposition intense de l’establishment rabbinique de son époque. Une grande partie de ses écrits fut supprimée, interdite ou perdue de son vivant. Il meurt à Acre à 39 ans.',
      'Ses œuvres — Messilat Yécharim, Daat Tevounot, Dérekh Hachem, Kala’h Pit’hé ’Hokhma, Adir BaMarom, Maamar HaGueoula et bien d’autres — sont fondatrices dans le monde juif. Son génie ne fut reconnu, pour l’essentiel, qu’après sa mort, et l’œuvre de l’institut consistant à publier ses écrits est comprise comme une réparation de cette négligence.',
    ],
  },
} as const

export default async function RamhalPage({ params }: PageProps<'/[locale]/ramhal'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const content = CONTENT[locale]

  return (
    <article className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 font-serif text-2xl font-semibold text-teal-deep">{content.title}</h1>
      <div className="flex flex-col gap-4 leading-relaxed">
        {content.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  )
}
