import { Play } from 'lucide-react'
import Image from 'next/image'

import { getDictionary } from '@/app/(frontend)/dictionary'
import { playlistVideoUrl, videoThumbnailUrl } from '@/lib/courses/youtubeLinks'

import type { Course } from '@/lib/courses/courses'
import type { Locale } from '@/lib/locale/locale'

export function LessonCard({
  course,
  locale,
  eager = false,
}: {
  course: Course
  locale: Locale
  eager?: boolean
}) {
  const dict = getDictionary(locale)
  return (
    <a
      href={playlistVideoUrl(course.firstLessonVideoId, course.playlistId)}
      target="_blank"
      rel="noreferrer"
      className="lesson-card group/lesson"
    >
      <div className="lesson-image">
        <Image
          src={videoThumbnailUrl(course.firstLessonVideoId)}
          alt={`${dict.nav.chriqui}: ${course.title}`}
          fill
          sizes="(min-width: 768px) 400px, 100vw"
          loading={eager ? 'eager' : 'lazy'}
          className="object-cover transition-transform duration-300 group-hover/lesson:scale-[1.03] motion-reduce:transform-none"
        />
        <span className="lesson-play">
          <Play className="size-5" fill="currentColor" aria-hidden />
        </span>
      </div>
      <div className="flex items-start justify-between gap-3 pt-5">
        <div>
          <h3 className="type-heading group-hover/lesson:underline underline-offset-4">{course.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{dict.home.lessonCount(course.lessonCount)}</p>
        </div>
        <span className="mt-1 hidden text-sm text-teal lg:inline">{dict.bookCourse.start}</span>
      </div>
    </a>
  )
}
