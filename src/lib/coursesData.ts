import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import { toCourse } from '@/lib/courses'
import type { CoursesPage } from '@/payload-types'
import type { Course } from '@/lib/courses'
import type { Locale } from '@/lib/locale'

/** Every course, in the order the editor dragged them into. */
export async function getCourses(locale: Locale): Promise<Course[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'series', locale, depth: 0, pagination: false, sort: '_order' })
  return docs.map(toCourse)
}

/** The courses that teach one book, for the lessons box on its page. */
export async function getCoursesForBook(locale: Locale, bookId: number): Promise<Course[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'series',
    locale,
    depth: 0,
    pagination: false,
    sort: '_order',
    where: { relatedBooks: { equals: bookId } },
  })
  return docs.map(toCourse)
}

/** The heading and introduction of the courses page, as the editor wrote them. */
export async function getCoursesPageText(locale: Locale): Promise<CoursesPage> {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'coursesPage', locale })
}
