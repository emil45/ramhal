import type { DefaultCellComponentProps } from 'payload'

type PopulatedMedia = { sizes?: { thumbnail?: { url?: string } }; url?: string }

function thumbnailUrl(cellData: unknown): string | null {
  if (!cellData || typeof cellData !== 'object') return null
  const media = cellData as PopulatedMedia
  return media.sizes?.thumbnail?.url ?? media.url ?? null
}

/** A small cover image in the books list, instead of a bare filename link —
 * most books have a typeset cover (docs/DESIGN.md), so this is what makes the
 * list recognisable at a glance. */
export function CoverThumbnail({ cellData }: DefaultCellComponentProps) {
  const url = thumbnailUrl(cellData)
  if (!url) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" width={40} height={60} style={{ objectFit: 'cover', borderRadius: '2px', display: 'block' }} />
}
