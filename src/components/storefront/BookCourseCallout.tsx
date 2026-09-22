import { ListVideo, Play } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { firstLessonUrl, playlistUrl } from '@/lib/fullBookCourses'
import { cn } from '@/lib/utils'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { FullBookCourse } from '@/lib/fullBookCourses'

export function BookCourseCallout({
  course,
  dict,
}: {
  course: FullBookCourse
  dict: Dictionary
}) {
  return (
    <Card className="rounded-[2px] border-s-[3px] border-s-gold bg-paper-deep py-5 ring-0">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-teal text-primary-foreground">
            <Play className="size-4" fill="currentColor" aria-hidden />
          </span>
          <div>
            <p className="type-subheading text-teal-deep">
              {dict.bookCourse.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {dict.bookCourse.body(course.lessonCount)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={firstLessonUrl(course)}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants()}
          >
            <Play data-icon="inline-start" fill="currentColor" aria-hidden />
            {dict.bookCourse.start}
          </a>
          <a
            href={playlistUrl(course)}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'bg-background',
            )}
          >
            <ListVideo data-icon="inline-start" aria-hidden />
            {dict.bookCourse.playlist}
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
