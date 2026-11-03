'use client'

import { useSelectColor, useSelectedColorId } from '@/components/storefront/BookColorContext'
import { Button } from '@/components/ui/button'
import { cn } from 'cn'

type BookColorPickerProps = {
  colors: { id: string; name: string; swatch: string }[]
  /** Already in the page's language: functions cannot cross from the server page into this component. */
  label: string
}

/** The colours a book comes in: one round swatch each, the chosen one ringed and named. */
export function BookColorPicker({ colors, label }: BookColorPickerProps) {
  const selectedColorId = useSelectedColorId()
  const selectColor = useSelectColor()
  const selected = colors.find((color) => color.id === selectedColorId)

  return (
    <div role="group" aria-labelledby="book-color-label" className="flex flex-col gap-2">
      <p id="book-color-label" className="text-sm">
        <span className="text-muted-foreground">{label}:</span> <span className="font-medium">{selected?.name}</span>
      </p>
      <ul className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = color.id === selectedColorId
          return (
            <li key={color.id}>
              <Button
                variant="ghost"
                aria-label={color.name}
                aria-pressed={isSelected}
                onClick={() => selectColor(color.id)}
                className={cn('size-9 rounded-full p-0 ring-1 ring-border ring-offset-2 ring-offset-background hover:opacity-90', isSelected && 'ring-2 ring-teal')}
                style={{ backgroundColor: color.swatch }}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
