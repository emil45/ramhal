import { Card } from '@/components/ui/card'

import type { Page } from '@/payload-types'

type StatGridBlock = Extract<NonNullable<Page['content']>[number], { blockType: 'statGrid' }>

export function StatGridView({ block }: { block: StatGridBlock }) {
  const items = block.items ?? []

  return (
    <Card className="grid grid-cols-2 gap-px rounded-[2px] bg-border p-0 ring-1 ring-border sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.id} className="flex min-h-28 flex-col justify-center gap-1 bg-card px-5 py-6 text-center">
          <p className="font-serif text-2xl font-bold tabular-nums text-teal-deep sm:text-3xl">{item.value}</p>
          <p className="text-sm leading-snug text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </Card>
  )
}
