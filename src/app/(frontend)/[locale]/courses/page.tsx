import { ArrowUpRight, BookOpenText, CirclePlay, Library, ListVideo, Play } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CoverImage } from '@/components/storefront/CoverImage'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getCatalogueBooks } from '@/lib/booksData'
import {
  firstLessonUrl,
  FULL_BOOK_COURSE_LESSON_COUNT,
  FULL_BOOK_COURSES,
  playlistUrl,
  preferredBookSlug,
} from '@/lib/fullBookCourses'
import { isLocale } from '@/lib/locale'
import { bookPath } from '@/lib/routes'

const CHANNEL_URL = 'https://www.youtube.com/@ramhalInstit/playlists'

const CONTENT = {
  he: {
    metadataDescription: 'לימוד מלא ושיטתי של ספרי הרמח״ל עם הרב מרדכי שריקי — מן השיעור הראשון ועד לסיום הספר.',
    eyebrow: 'בית מדרש פתוח · מכון רמח״ל',
    title: 'ללמוד ספר שלם עם הרב שריקי',
    lead: 'לא רק שיעור בודד: מהלך רצוף בתוך הספר, סעיף אחר סעיף, מן הפתיחה ועד הסיום.',
    browseCourses: 'לקורסים המלאים',
    youtubeChannel: 'לערוץ ביוטיוב',
    promise: 'הספר פתוח. הרב מלמד. אפשר להתחיל מההתחלה.',
    courseCount: 'ספרים נלמדים במלואם',
    lessonCount: 'שיעורים בארכיון',
    teacherCount: 'רב אחד לאורך כל הדרך',
    coursesTitle: 'קורסים מלאים בספרי הרמח״ל',
    coursesIntro: 'כל קורס כאן מוביל ישירות לשיעור הראשון. אפשר גם לפתוח את הפלייליסט המלא, ולצד הספרים הקיימים בחנות לעבור אל המהדורה המתאימה.',
    language: 'עברית',
    lessons: (count: number) => `${count} שיעורים`,
    start: 'התחילו בשיעור הראשון',
    playlist: 'לכל השיעורים',
    book: 'לעמוד הספר',
    bookUnavailable: 'הספר אינו מוצע כרגע בחנות',
    opensOnYoutube: 'השיעורים נפתחים בערוץ הרשמי של מכון רמח״ל ביוטיוב.',
  },
  en: {
    metadataDescription: 'Complete, systematic courses through the Ramhal’s books with Rabbi Mordechai Chriqui, from the first lesson to the end of the work.',
    eyebrow: 'An open beit midrash · Machon Ramhal',
    title: 'Study a complete book with Rabbi Chriqui',
    lead: 'Not a single lecture, but a continuous journey through the text — section by section, from its opening to its conclusion.',
    browseCourses: 'Explore the full courses',
    youtubeChannel: 'YouTube channel',
    promise: 'Open the book. Join the Rabbi. Begin at the beginning.',
    courseCount: 'complete book courses',
    lessonCount: 'lessons in the library',
    teacherCount: 'one teacher throughout',
    coursesTitle: 'Complete courses through the Ramhal’s books',
    coursesIntro: 'Every course begins with a direct link to lesson one. You can also open the full playlist and, where the institute publishes the work, visit its catalogue page.',
    language: 'Hebrew',
    lessons: (count: number) => `${count} lessons`,
    start: 'Start with lesson one',
    playlist: 'View every lesson',
    book: 'View the book',
    bookUnavailable: 'This work is not currently in the catalogue',
    opensOnYoutube: 'Lessons open on Machon Ramhal’s official YouTube channel.',
  },
  fr: {
    metadataDescription: 'Des cours complets et méthodiques sur les livres du Ramhal avec le Rav Mordekhaï Chriqui, du premier cours jusqu’à l’achèvement de l’ouvrage.',
    eyebrow: 'Un beit hamidrach ouvert · Institut Ramhal',
    title: 'Étudier un livre entier avec le Rav Chriqui',
    lead: 'Non pas un cours isolé, mais un parcours suivi dans le texte — section après section, de l’ouverture à l’achèvement.',
    browseCourses: 'Découvrir les cours complets',
    youtubeChannel: 'Chaîne YouTube',
    promise: 'Ouvrir le livre. Rejoindre le Rav. Commencer au commencement.',
    courseCount: 'livres étudiés intégralement',
    lessonCount: 'cours dans la bibliothèque',
    teacherCount: 'un même enseignant du début à la fin',
    coursesTitle: 'Cours complets sur les livres du Ramhal',
    coursesIntro: 'Chaque parcours mène directement au premier cours. Vous pouvez aussi ouvrir la playlist complète et, lorsque l’institut publie l’ouvrage, rejoindre sa page dans le catalogue.',
    language: 'Hébreu',
    lessons: (count: number) => `${count} cours`,
    start: 'Commencer par le premier cours',
    playlist: 'Voir tous les cours',
    book: 'Voir le livre',
    bookUnavailable: 'Cet ouvrage n’est pas proposé actuellement',
    opensOnYoutube: 'Les cours s’ouvrent sur la chaîne YouTube officielle de l’Institut Ramhal.',
  },
} as const

export const revalidate = 3600

export async function generateMetadata({ params }: PageProps<'/[locale]/courses'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  return { title: CONTENT[locale].title, description: CONTENT[locale].metadataDescription }
}

export default async function CoursesPage({ params }: PageProps<'/[locale]/courses'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const content = CONTENT[locale]
  const books = await getCatalogueBooks(locale)
  const booksBySlug = new Map(books.map((book) => [book.urlSlug, book]))

  return (
    <article>
      <section className="border-b border-border bg-paper-deep">
        <div className="page-container grid items-center gap-10 py-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16 lg:py-16">
          <div className="flex max-w-3xl flex-col items-start gap-5">
            <Badge variant="outline" className="rounded-[2px] border-gold/70 bg-background/60 px-3 text-gold-ink">
              {content.eyebrow}
            </Badge>
            <h1 className="type-display">{content.title}</h1>
            <p className="max-w-2xl text-xl leading-relaxed sm:text-2xl">{content.lead}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#courses" className={buttonVariants({ size: 'lg' })}>
                <BookOpenText data-icon="inline-start" aria-hidden />
                {content.browseCourses}
              </a>
              <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                <CirclePlay data-icon="inline-start" aria-hidden />
                {content.youtubeChannel}
              </a>
            </div>
          </div>

          <aside className="border border-gold bg-background p-6 sm:p-8">
            <p className="font-serif text-2xl leading-relaxed text-teal-deep sm:text-3xl">{content.promise}</p>
            <span aria-hidden className="my-6 block h-[3px] w-16 bg-gold" />
            <dl className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-xs leading-relaxed text-muted-foreground">{content.courseCount}</dt>
                <dd className="mt-1 font-serif text-3xl text-teal-deep">{FULL_BOOK_COURSES.length}</dd>
              </div>
              <div className="border-s border-border ps-4">
                <dt className="text-xs leading-relaxed text-muted-foreground">{content.lessonCount}</dt>
                <dd className="mt-1 font-serif text-3xl text-teal-deep">{FULL_BOOK_COURSE_LESSON_COUNT}</dd>
              </div>
              <div className="border-s border-border ps-4">
                <dt className="text-xs leading-relaxed text-muted-foreground">{content.teacherCount}</dt>
                <dd className="mt-1 font-serif text-3xl text-teal-deep">1</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section id="courses" className="page-container scroll-mt-6 py-12 lg:py-16">
        <div className="mb-10 max-w-3xl">
          <div className="relative border-b border-border pb-3">
            <h2 className="type-heading">{content.coursesTitle}</h2>
            <span aria-hidden className="absolute start-0 -bottom-px h-[3px] w-16 bg-gold" />
          </div>
          <p className="mt-5 leading-relaxed text-muted-foreground">{content.coursesIntro}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {FULL_BOOK_COURSES.map((course) => {
            const bookSlug = preferredBookSlug(course, locale)
            const book = bookSlug ? booksBySlug.get(bookSlug) : undefined

            return (
              <Card key={course.id} className="rounded-[2px] border border-border py-5 ring-0">
                <CardContent className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-5 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
                  <div className="group/cover">
                    <CoverImage
                      categorySlug={book?.category?.slug ?? 'hebrew-books'}
                      cover={book && typeof book.cover === 'object' ? book.cover : null}
                      sizes="120px"
                      title={book?.displayTitle ?? course.title[locale]}
                    />
                  </div>

                  <div className="flex min-w-0 flex-col items-start">
                    <Badge variant="outline" className="rounded-[2px] text-muted-foreground">
                      {content.language}
                    </Badge>
                    <h3 className="type-subheading mt-3 text-teal-deep">{course.title[locale]}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <ListVideo className="size-4 text-gold-ink" aria-hidden />
                      {content.lessons(course.lessonCount)}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <a href={firstLessonUrl(course)} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'sm' })}>
                        <Play data-icon="inline-start" fill="currentColor" aria-hidden />
                        {content.start}
                      </a>
                      <a href={playlistUrl(course)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        <ListVideo data-icon="inline-start" aria-hidden />
                        {content.playlist}
                      </a>
                    </div>

                    {book ? (
                      <Link
                        href={bookPath(locale, book.urlSlug)}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal underline-offset-4 hover:underline"
                      >
                        {content.book}
                        <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
                      </Link>
                    ) : (
                      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Library className="size-3.5" aria-hidden />
                        {content.bookUnavailable}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <CirclePlay className="me-1.5 inline size-4 align-[-0.15em] text-gold-ink" aria-hidden />
          {content.opensOnYoutube}
        </p>
      </section>
    </article>
  )
}
