import type { Page } from '@/payload-types'

type LabeledListBlock = Extract<NonNullable<Page['content']>[number], { blockType: 'labeledList' }>

/** An ordinal grid of short callouts, or a stacked definition list — the
 * same label+body shape, in the two layouts the narrative pages use. */
export function LabeledListView({ block }: { block: LabeledListBlock }) {
  const items = block.items ?? []

  if (block.layout === 'grid') {
    return (
      <ol className="mt-8 grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="border-t-[3px] border-gold pt-5">
            {item.marker ? (
              <span aria-hidden className="font-serif text-4xl leading-none text-gold-ink">
                {item.marker}
              </span>
            ) : null}
            <h3 className="mt-3 font-serif text-xl font-semibold text-teal-deep">{item.label}</h3>
            <p className="mt-2 leading-7 text-muted-foreground">{item.body}</p>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <dl className="mt-8 divide-y divide-border border-y border-border">
      {items.map((item) => (
        <div key={item.id} className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
          <dt className="font-serif text-lg font-semibold text-teal-deep">{item.label}</dt>
          <dd className="leading-7 text-muted-foreground">{item.body}</dd>
        </div>
      ))}
    </dl>
  )
}
