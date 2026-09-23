import { BookOpen } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { Page } from '@/payload-types'

type TagListBlock = Extract<NonNullable<Page['content']>[number], { blockType: 'tagList' }>

export function TagListView({ block }: { block: TagListBlock }) {
  const tags = block.tags ?? []

  return (
    <Card className="rounded-[2px] bg-paper-deep ring-border">
      <CardHeader className="rounded-none border-b border-border pb-4">
        <CardTitle className="type-subheading! flex items-center gap-2 text-teal-deep">
          <BookOpen aria-hidden className="size-5 text-gold-ink" />
          {block.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.id}>
              <Badge variant="secondary" className="rounded-[2px] px-3 py-1 text-sm font-normal">
                {tag.label}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
