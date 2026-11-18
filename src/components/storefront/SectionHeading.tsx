import type { ReactNode } from 'react'

export function SectionHeading({
  action,
  as: Tag = 'h2',
  children,
  eyebrow,
  description,
}: {
  action?: ReactNode
  as?: 'h1' | 'h2'
  children: ReactNode
  eyebrow?: string
  description?: string
}) {
  return (
    <div className="section-heading">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <Tag className={Tag === 'h1' ? 'type-display' : 'type-title'}>{children}</Tag>
        {description ? <p className="mt-3 max-w-2xl text-base text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
