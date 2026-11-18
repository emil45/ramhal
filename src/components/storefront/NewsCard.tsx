import Image from 'next/image'
import Link from 'next/link'

import { RichText } from '@/components/storefront/RichText'

import type { NewsItem } from '@/lib/content/homeStream'

type NewsCardProps = {
  intlTag: string
  item: NewsItem
  imageLabel: string
}

export function NewsCard({ intlTag, item, imageLabel }: NewsCardProps) {
  const formattedDate = new Intl.DateTimeFormat(intlTag, { dateStyle: 'long' }).format(new Date(item.date))
  const imageSource = item.image?.url
  const hasImage = Boolean(imageSource && item.image?.width && item.image?.height)

  return (
    <article className="news-card">
      <time dateTime={item.date} className="text-sm text-muted-foreground">
        {formattedDate}
      </time>
      <h3 className="type-heading">{item.title}</h3>
      {item.location ? <p className="mb-3 text-sm text-muted-foreground">{item.location}</p> : null}
      {item.body ? <RichText content={item.body} className="text-base text-muted-foreground" /> : null}
      {hasImage && imageSource && item.image?.width && item.image.height ? (
        <a
          href={imageSource}
          target="_blank"
          rel="noreferrer"
          className="news-card-image"
          aria-label={`${imageLabel}: ${item.title}`}
        >
          <Image
            src={imageSource}
            alt={item.image.alt || item.title}
            fill
            sizes="(min-width: 768px) 400px, 100vw"
            className="object-contain"
          />
        </a>
      ) : null}
      {item.link ? (
        /^https?:\/\//.test(item.link.url) ? (
          <a href={item.link.url} target="_blank" rel="noreferrer" className="text-link mt-3">
            {item.link.label}
          </a>
        ) : (
          <Link href={item.link.url} className="text-link mt-3">
            {item.link.label}
          </Link>
        )
      ) : null}
    </article>
  )
}
