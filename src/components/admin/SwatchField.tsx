'use client'

import { FieldLabel, useField } from '@payloadcms/ui'

import type { TextFieldClientProps } from 'payload'

const DEFAULT_SWATCH = '#7a2e2e'

/** A colour picker for the `swatch` field; the value stays a plain #rrggbb string. */
export function SwatchField({ field, path }: TextFieldClientProps) {
  const { setValue, value } = useField<string>({ path })
  const swatch = value || DEFAULT_SWATCH

  return (
    <div className="field-type text">
      <FieldLabel label={field.label} path={path} required={field.required} />
      <div style={{ alignItems: 'center', display: 'flex', gap: '0.75rem' }}>
        <input
          aria-label={typeof field.label === 'string' ? field.label : undefined}
          id={`field-${path}`}
          type="color"
          value={swatch}
          onChange={(event) => setValue(event.currentTarget.value)}
          style={{ blockSize: '2.5rem', cursor: 'pointer', inlineSize: '4rem' }}
        />
        <code dir="ltr">{swatch}</code>
      </div>
    </div>
  )
}
