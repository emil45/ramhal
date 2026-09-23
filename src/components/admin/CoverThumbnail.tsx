'use client'

import { useEffect, useState } from 'react'

import type { DefaultCellComponentProps } from 'payload'

type PopulatedMedia = { sizes?: { thumbnail?: { url?: string } }; url?: string }

function thumbnailUrl(media: PopulatedMedia): string | null {
  return media.sizes?.thumbnail?.url ?? media.url ?? null
}

/** A small cover image in the books list, instead of a bare filename link —
 * most books have a typeset cover (docs/DESIGN.md), so this is what makes the
 * list recognisable at a glance.
 *
 * The list view queries at depth 0 (Payload hardcodes this for list
 * performance), so `cellData` here is the media document's ID, never the
 * populated document — this fetches the cover itself rather than assuming
 * data the list query never returns. */
export function CoverThumbnail({ cellData }: DefaultCellComponentProps) {
  // The Postgres adapter's media IDs are numbers, not the ObjectId strings
  // Mongo would give — the Cell must handle both.
  const mediaId = typeof cellData === 'string' || typeof cellData === 'number' ? cellData : null
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!mediaId) return

    const controller = new AbortController()
    fetch(`/api/media/${mediaId}`, { credentials: 'include', signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((media: PopulatedMedia | null) => {
        if (media) setUrl(thumbnailUrl(media))
      })
      .catch((error) => {
        if (error.name !== 'AbortError') throw error
      })

    return () => controller.abort()
  }, [mediaId])

  if (!url) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" width={40} height={60} style={{ objectFit: 'cover', borderRadius: '2px', display: 'block' }} />
}
