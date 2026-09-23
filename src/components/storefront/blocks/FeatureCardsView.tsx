import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PAGE_ICONS } from '@/lib/pageIcons'

import type { Page } from '@/payload-types'

type FeatureCardsBlock = Extract<NonNullable<Page['content']>[number], { blockType: 'featureCards' }>

export function FeatureCardsView({ block }: { block: FeatureCardsBlock }) {
  const items = block.items ?? []

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => {
        const Icon = PAGE_ICONS[item.icon]
        return (
          <Card key={item.id} className="rounded-[2px] ring-border">
            <CardHeader>
              <Icon aria-hidden className="size-6 text-gold-ink" />
              <CardTitle className="type-subheading! text-teal-deep">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground">{item.body}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
