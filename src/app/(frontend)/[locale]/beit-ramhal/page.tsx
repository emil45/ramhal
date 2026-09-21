import { BookOpen, Building2, Landmark, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SectionHeading } from '@/components/storefront/SectionHeading'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { isLocale } from '@/lib/locale'
import { localePath } from '@/lib/routes'

const CONTENT = {
  he: {
    metadataDescription: 'בית המדרש ובית הכנסת של מכון רמח״ל בהר נוף, ירושלים, שנבנה בהשראת בית הכנסת של הרמח״ל בפדובה.',
    eyebrow: 'הר נוף · ירושלים',
    title: 'בית רמח״ל',
    lead: 'בית של תורה, תפילה ויצירה — המקום שבו מפעלו של מכון רמח״ל מקבל חיים מדי יום.',
    location: 'רח׳ הרב רפאל קצנלבוגן 73, ירושלים',
    heroAlt: 'הרב מרדכי שריקי מוסר שיעור בבית המדרש המלא בלומדים',
    statistics: [
      { value: '4', label: 'קומות' },
      { value: 'כ־1,200 מ״ר', label: 'שטח המבנה' },
      { value: 'כ־15', label: 'אברכי כולל בתשע״ה' },
      { value: '50+', label: 'משתתפים בשיעורים בתשע״ה' },
    ],
    midrashTitle: 'בית מדרש רמח״ל',
    midrashParagraphs: [
      'בית מדרש רמח״ל הוא חלק מבית כנסת רמח״ל בשכונת הר נוף בירושלים. הכולל והשיעורים ממשיכים את שליחותו של המכון: לימוד שיטתי ומעמיק של תורת הרמח״ל לצד סדרי לימוד בהלכה ובקבלה.',
      'בתיאור שפורסם באתר הישן בשנת תשע״ה (2015) למדו בכולל כחמישה עשר אברכים, ויותר מחמישים איש השתתפו בשיעורים. הנתונים מובאים כאן כתיעוד של אותה שנה, ולא כמספרים עדכניים.',
    ],
    studiesLabel: 'בין סדרי הלימוד',
    studies: ['הלכה', 'עץ חיים', 'קל״ח פתחי חכמה', 'דעת תבונות', 'מסילת ישרים'],
    synagogueTitle: 'פדובה בירושלים',
    synagogueParagraphs: [
      'בית הכנסת נבנה כדוגמת בית הכנסת בפדובה שבו התפלל הרמח״ל, ואשר נחרב בשואה. לפי תיאור המכון, זהו בית הכנסת היחיד בעולם שנבנה בדמותו. הוא משמר בירושלים זיכרון אדריכלי ורוחני של עולמו של הרמח״ל — לא כמוזיאון, אלא כבית תפילה חי.',
      'המבנה משתרע על פני כ־1,200 מ״ר וארבע קומות. תחת קורת גג אחת נמצאים אולם, חדרי לימוד, משרדים, בית מדרש, מקווה ובית הכנסת הגדול.',
    ],
    sanctuaryAlt: 'חלל בית הכנסת של בית רמח״ל, ובמרכזו ארון הקודש',
    buildingTitle: 'בית אחד, שלושה מעגלים',
    buildingDetails: [
      { title: 'קהילה', description: 'בית כנסת פעיל לתפילה ולחיי קהילה.' },
      { title: 'לימוד', description: 'כולל, בית מדרש וחדרי שיעורים ללימוד מתמשך.' },
      { title: 'המכון', description: 'משרדי מכון רמח״ל ומרכז מפעל ההוצאה לאור.' },
    ],
    closingTitle: 'מסורת שנכנסים לתוכה',
    closingBody: 'האדריכלות מחברת בין פדובה לירושלים; הלימוד והתפילה הם שהופכים את המבנה לבית.',
    exteriorAlt: 'המבנה החיצוני של בית רמח״ל בהר נוף, ירושלים',
    arkAlt: 'ארון הקודש המפואר בבית הכנסת רמח״ל',
    scheduleAction: 'ללוח השיעורים והתפילות',
  },
  en: {
    metadataDescription: 'The beit midrash and synagogue of Machon Ramhal in Har Nof, Jerusalem, inspired by the Ramhal’s synagogue in Padua.',
    eyebrow: 'Har Nof · Jerusalem',
    title: 'Beit Ramhal',
    lead: 'A home of Torah, prayer and creation — where the work of Machon Ramhal is lived every day.',
    location: '73 Rabbi Rafael Katzenelbogen Street, Jerusalem',
    heroAlt: 'Rabbi Mordechai Chriqui teaching in a study hall filled with students',
    statistics: [
      { value: '4', label: 'floors' },
      { value: 'c. 1,200 m²', label: 'building area' },
      { value: 'c. 15', label: 'kollel scholars in 2015' },
      { value: '50+', label: 'class participants in 2015' },
    ],
    midrashTitle: 'Beit Midrash Ramhal',
    midrashParagraphs: [
      'Beit Midrash Ramhal is part of the Ramhal synagogue in Jerusalem’s Har Nof neighbourhood. Its kollel and classes continue the institute’s mission: sustained, systematic study of the Ramhal alongside halakha and kabbalah.',
      'The legacy website recorded around fifteen full-time scholars and more than fifty class participants in 2015. These figures document that year and are not presented as current attendance.',
    ],
    studiesLabel: 'Among the subjects studied',
    studies: ['Halakha', 'Etz Chaim', 'Kalach Pitchei Chochma', 'Daat Tevunot', 'Mesillat Yesharim'],
    synagogueTitle: 'Padua in Jerusalem',
    synagogueParagraphs: [
      'The synagogue was built after the synagogue in Padua where the Ramhal prayed, which was destroyed in the Holocaust. The institute describes it as the only synagogue in the world built to that model. In Jerusalem it preserves an architectural and spiritual memory of his world — not as a museum, but as a living house of prayer.',
      'The four-storey building covers approximately 1,200 square metres. It brings together a hall, classrooms, offices, a beit midrash, a mikveh and the main synagogue.',
    ],
    sanctuaryAlt: 'The sanctuary of Beit Ramhal with its ark at the centre',
    buildingTitle: 'One home, three circles',
    buildingDetails: [
      { title: 'Community', description: 'An active synagogue for prayer and communal life.' },
      { title: 'Study', description: 'A kollel, beit midrash and classrooms for sustained learning.' },
      { title: 'Institute', description: 'The offices of Machon Ramhal and the centre of its publishing work.' },
    ],
    closingTitle: 'A tradition you can enter',
    closingBody: 'The architecture connects Padua and Jerusalem; study and prayer are what turn the building into a home.',
    exteriorAlt: 'The exterior of Beit Ramhal in Har Nof, Jerusalem',
    arkAlt: 'The ornate Torah ark in the Ramhal synagogue',
    scheduleAction: 'View classes and prayer times',
  },
  fr: {
    metadataDescription: 'Le beit hamidrach et la synagogue de l’Institut Ramhal à Har Nof, Jérusalem, inspirés de la synagogue du Ramhal à Padoue.',
    eyebrow: 'Har Nof · Jérusalem',
    title: 'Beit Ramhal',
    lead: 'Une maison d’étude, de prière et de création — le lieu où l’œuvre de l’Institut Ramhal prend vie chaque jour.',
    location: '73, rue du Rav Rafael Katzenelbogen, Jérusalem',
    heroAlt: 'Le Rav Mordekhaï Chriqui donne un cours dans une salle d’étude remplie d’élèves',
    statistics: [
      { value: '4', label: 'étages' },
      { value: 'env. 1 200 m²', label: 'de superficie' },
      { value: 'env. 15', label: 'avrekhim au kollel en 2015' },
      { value: '50+', label: 'participants aux cours en 2015' },
    ],
    midrashTitle: 'Beit Hamidrach Ramhal',
    midrashParagraphs: [
      'Le Beit Hamidrach Ramhal fait partie de la synagogue Ramhal, dans le quartier de Har Nof à Jérusalem. Son kollel et ses cours prolongent la mission de l’institut : une étude suivie et méthodique de l’œuvre du Ramhal, aux côtés de la halakha et de la kabbale.',
      'L’ancien site indiquait qu’en 2015, une quinzaine d’avrekhim étudiaient au kollel et plus de cinquante personnes suivaient les cours. Ces chiffres documentent cette année-là et ne sont pas présentés comme des effectifs actuels.',
    ],
    studiesLabel: 'Parmi les matières étudiées',
    studies: ['Halakha', 'Etz Haïm', 'Kala’h Pit’hé Hokhma', 'Daat Tevounot', 'Messilat Yécharim'],
    synagogueTitle: 'Padoue à Jérusalem',
    synagogueParagraphs: [
      'La synagogue a été bâtie sur le modèle de celle de Padoue où priait le Ramhal, détruite pendant la Shoah. L’institut la présente comme la seule synagogue au monde construite selon ce modèle. Elle en préserve à Jérusalem la mémoire architecturale et spirituelle — non comme un musée, mais comme une maison de prière vivante.',
      'Le bâtiment s’étend sur environ 1 200 m² et quatre étages. Il réunit une salle, des salles d’étude, des bureaux, un beit hamidrach, un mikvé et la grande synagogue.',
    ],
    sanctuaryAlt: 'La synagogue de Beit Ramhal, avec l’arche sainte au centre',
    buildingTitle: 'Une maison, trois cercles',
    buildingDetails: [
      { title: 'Communauté', description: 'Une synagogue active pour la prière et la vie communautaire.' },
      { title: 'Étude', description: 'Un kollel, un beit hamidrach et des salles pour une étude suivie.' },
      { title: 'Institut', description: 'Les bureaux de l’Institut Ramhal et le centre de son travail éditorial.' },
    ],
    closingTitle: 'Une tradition dans laquelle entrer',
    closingBody: 'L’architecture relie Padoue à Jérusalem ; l’étude et la prière font du bâtiment une maison.',
    exteriorAlt: 'L’extérieur de Beit Ramhal à Har Nof, Jérusalem',
    arkAlt: 'L’arche sainte ouvragée de la synagogue Ramhal',
    scheduleAction: 'Voir les cours et les horaires de prière',
  },
} as const

const BUILDING_ICONS = [Landmark, BookOpen, Building2]

export async function generateMetadata({ params }: PageProps<'/[locale]/beit-ramhal'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const content = CONTENT[locale]

  return {
    title: content.title,
    description: content.metadataDescription,
  }
}

export default async function BeitRamhalPage({ params }: PageProps<'/[locale]/beit-ramhal'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const content = CONTENT[locale]
  const scheduleHref = `${localePath(locale, '/')}#schedule`

  return (
    <article>
      <section className="border-b border-border bg-paper-deep">
        <div className="page-container grid items-center gap-10 py-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14 lg:py-16">
          <div className="flex flex-col items-start gap-5">
            <Badge variant="outline" className="rounded-[2px] border-gold/70 bg-background/60 px-3 text-gold-ink">
              {content.eyebrow}
            </Badge>
            <h1 className="type-display">{content.title}</h1>
            <p className="max-w-xl text-xl leading-relaxed text-foreground sm:text-2xl">{content.lead}</p>
            <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-ink" />
              <span>{content.location}</span>
            </p>
          </div>

          <div className="relative border border-gold bg-background p-2 shadow-[0_14px_40px_rgb(0_79_88/0.10)]">
            <AspectRatio ratio={16 / 9} className="overflow-hidden bg-muted">
              <Image
                src="/beit-ramhal/study-hall.webp"
                alt={content.heroAlt}
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            </AspectRatio>
            <span aria-hidden className="absolute end-4 -bottom-1 h-[3px] w-24 bg-gold" />
          </div>
        </div>
      </section>

      <div className="page-container pt-12">
        <Card className="grid grid-cols-2 gap-px rounded-[2px] bg-border p-0 ring-1 ring-border sm:grid-cols-4">
          {content.statistics.map((statistic) => (
            <div key={statistic.label} className="flex min-h-28 flex-col justify-center gap-1 bg-card px-5 py-6 text-center">
              <p className="font-serif text-2xl font-bold tabular-nums text-teal-deep sm:text-3xl">{statistic.value}</p>
              <p className="text-sm leading-snug text-muted-foreground">{statistic.label}</p>
            </div>
          ))}
        </Card>
      </div>

      <section className="page-container py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
          <div>
            <SectionHeading>{content.midrashTitle}</SectionHeading>
            <div className="flex max-w-2xl flex-col gap-5 text-lg leading-[1.8]">
              {content.midrashParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <Card className="rounded-[2px] bg-paper-deep ring-border">
            <CardHeader className="rounded-none border-b border-border pb-4">
              <CardTitle className="type-subheading! flex items-center gap-2 text-teal-deep">
                <BookOpen aria-hidden className="size-5 text-gold-ink" />
                {content.studiesLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-wrap gap-2">
                {content.studies.map((subject) => (
                  <li key={subject}>
                    <Badge variant="secondary" className="rounded-[2px] px-3 py-1 text-sm font-normal">
                      {subject}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y border-border bg-paper-deep">
        <div className="page-container grid items-center gap-10 py-16 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
          <figure className="border border-gold bg-background p-2">
            <AspectRatio ratio={1280 / 856} className="overflow-hidden bg-muted">
              <Image
                src="/beit-ramhal/sanctuary.webp"
                alt={content.sanctuaryAlt}
                fill
                sizes="(min-width: 1024px) 54vw, 100vw"
                className="object-cover"
              />
            </AspectRatio>
          </figure>

          <div>
            <SectionHeading>{content.synagogueTitle}</SectionHeading>
            <div className="flex flex-col gap-5 text-lg leading-[1.8]">
              {content.synagogueParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-container py-16">
        <SectionHeading>{content.buildingTitle}</SectionHeading>
        <div className="grid gap-4 md:grid-cols-3">
          {content.buildingDetails.map((detail, index) => {
            const Icon = BUILDING_ICONS[index]

            return (
              <Card key={detail.title} className="rounded-[2px] ring-border">
                <CardHeader>
                  <Icon aria-hidden className="size-6 text-gold-ink" />
                  <CardTitle className="type-subheading! text-teal-deep">{detail.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-muted-foreground">{detail.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="page-container grid items-start gap-8 py-16 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col">
            <figure className="border border-gold bg-paper-deep p-2">
              <AspectRatio ratio={3 / 4} className="overflow-hidden bg-muted">
                <Image
                  src="/beit-ramhal/exterior.webp"
                  alt={content.exteriorAlt}
                  fill
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover"
                />
              </AspectRatio>
            </figure>
            <div className="flex flex-col items-start gap-5 border-x border-b border-border bg-paper-deep px-6 py-8">
              <h2 className="type-heading">{content.closingTitle}</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">{content.closingBody}</p>
              <Separator className="bg-gold/50" />
              <Link href={scheduleHref} className={buttonVariants({ size: 'lg' })}>
                {content.scheduleAction}
              </Link>
            </div>
          </div>

          <figure className="border border-gold bg-paper-deep p-2">
            <AspectRatio ratio={2 / 3} className="overflow-hidden bg-muted">
              <Image
                src="/beit-ramhal/ark.webp"
                alt={content.arkAlt}
                fill
                sizes="(min-width: 1024px) 57vw, 100vw"
                className="object-cover object-[center_42%]"
              />
            </AspectRatio>
          </figure>
        </div>
      </section>
    </article>
  )
}
