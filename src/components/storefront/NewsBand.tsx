import type { NewsItem } from '@/lib/homeStream'

type NewsBandProps = {
  intlTag: string
  item: NewsItem | undefined
  moreLabel: string
}

export function NewsBand({ intlTag, item, moreLabel }: NewsBandProps) {
  if (!item) return null

  const formattedDate = new Intl.DateTimeFormat(intlTag, { dateStyle: 'medium' }).format(new Date(item.date))

  return (
    <div className="border-b border-gold/60 bg-paper-deep">
      <div className="page-container grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 py-2 text-sm">
        <time dateTime={item.date} className="whitespace-nowrap text-muted-foreground">
          {formattedDate}
        </time>
        <p className="line-clamp-2 min-w-0 font-medium text-teal-deep sm:truncate">{item.title}</p>
        <a href="#news" className="whitespace-nowrap font-medium text-teal underline-offset-4 hover:underline">
          {moreLabel}
        </a>
      </div>
    </div>
  )
}
