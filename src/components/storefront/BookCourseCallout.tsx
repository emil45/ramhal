import { Play } from 'lucide-react'
import Image from 'next/image'

import { playlistUrl, playlistVideoUrl, videoThumbnailUrl } from '@/lib/courses/youtubeLinks'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { Course } from '@/lib/courses/courses'

export function BookCourseCallout({ course, dict }: { course: Course; dict: Dictionary }) {
  return (
    <aside className="book-course">
      <a
        href={playlistVideoUrl(course.firstLessonVideoId, course.playlistId)}
        target="_blank"
        rel="noreferrer"
        className="book-course-image"
        aria-label={`${dict.bookCourse.start}: ${course.title}`}
      >
        <Image
          src={videoThumbnailUrl(course.firstLessonVideoId)}
          alt={`${dict.nav.chriqui}: ${course.title}`}
          fill
          sizes="(min-width: 768px) 160px, 100vw"
          className="object-cover"
        />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-9 place-items-center rounded-full bg-white text-teal">
            <Play className="size-4" fill="currentColor" aria-hidden />
          </span>
        </span>
      </a>
      <div>
        <h2 className="type-subheading">{dict.bookCourse.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{dict.bookCourse.body(course.lessonCount)}</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          <a
            href={playlistVideoUrl(course.firstLessonVideoId, course.playlistId)}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            {dict.bookCourse.start}
          </a>
          <a href={playlistUrl(course.playlistId)} target="_blank" rel="noreferrer" className="text-link">
            {dict.bookCourse.playlist}
          </a>
        </div>
      </div>
    </aside>
  )
}
