'use client'

import { useRowLabel } from '@payloadcms/ui'

type ColorRow = { name?: string; swatch?: string }

/** What a collapsed colour row says, instead of "צבע 01": a swatch and the name. */
export function ColorRowLabel() {
  const { data } = useRowLabel<ColorRow>()
  return (
    <span style={{ alignItems: 'center', display: 'inline-flex', gap: '0.5rem' }}>
      <span aria-hidden style={{ background: data.swatch ?? 'transparent', border: '1px solid #8886', borderRadius: '50%', display: 'inline-block', height: '1rem', width: '1rem' }} />
      {data.name || 'צבע חדש'}
    </span>
  )
}
