import type { Book, Media } from '@/payload-types'

type Reference = number | Media | null | undefined

function populated(reference: Reference): Media | null {
  return typeof reference === 'object' && reference !== null ? reference : null
}

/**
 * The pictures of one book in the order a visitor sees them: the cover first,
 * then the gallery. An unpopulated reference (a deleted file) is dropped, and
 * so is a gallery entry that repeats the cover or an earlier entry — an editor
 * adding the cover to the gallery as well must not show it twice.
 */
export function collectBookImages(cover: Reference, gallery: Book['gallery']): Media[] {
  const seen = new Set<number>()
  const images: Media[] = []
  for (const reference of [cover, ...(gallery ?? []).map((entry) => entry.image)]) {
    const media = populated(reference)
    if (!media || seen.has(media.id)) continue
    seen.add(media.id)
    images.push(media)
  }
  return images
}
