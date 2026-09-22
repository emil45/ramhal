import Image from 'next/image'
import Link from 'next/link'

import { RichText } from '@/components/storefront/RichText'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { NewsItem } from '@/lib/homeStream'

type NewsCardProps = {
  intlTag: string
  item: NewsItem
}

export function NewsCard({ intlTag, item }: NewsCardProps) {
  const formattedDate = new Intl.DateTimeFormat(intlTag, { dateStyle: 'long' }).format(new Date(item.date))
  const imageSource = item.image?.url
  const hasImage = Boolean(imageSource && item.image?.width && item.image?.height)
  const hasContent = Boolean(item.body || hasImage || item.link)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="type-subheading!">{item.title}</CardTitle>
          <time dateTime={item.date} className="text-sm text-muted-foreground">
            {formattedDate}
          </time>
        </div>
        {item.location ? <p className="text-sm text-muted-foreground">{item.location}</p> : null}
      </CardHeader>
      {hasContent ? (
        <CardContent className="flex flex-col items-start gap-5">
          {item.body ? <RichText content={item.body} /> : null}
          {hasImage && imageSource && item.image?.width && item.image.height ? (
            // Flyers often carry the announcement text, so cropping would remove content (TASK-28).
            <div className="flex max-h-[70vh] w-full justify-center overflow-hidden bg-paper-deep p-3 md:max-w-lg">
              <Image
                src={imageSource}
                alt={item.image.alt || item.title}
                width={item.image.width}
                height={item.image.height}
                sizes="(max-width: 640px) calc(100vw - 3.5rem), 32rem"
                className="max-h-[calc(70vh-1.5rem)] w-auto max-w-full object-contain"
              />
            </div>
          ) : null}
          {item.link ? (
            /^https?:\/\//.test(item.link.url) ? (
              <a href={item.link.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
                {item.link.label}
              </a>
            ) : (
              <Link href={item.link.url} className={buttonVariants({ variant: 'outline' })}>
                {item.link.label}
              </Link>
            )
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  )
}
