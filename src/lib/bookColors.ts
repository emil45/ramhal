import type { Book } from '@/payload-types'

export type BookColor = NonNullable<Book['colors']>[number]

const SWATCH_PATTERN = /^#[0-9a-f]{6}$/i

export const COLOR_NAME_SEPARATOR = ' — '

export function isValidSwatch(swatch: string): boolean {
  return SWATCH_PATTERN.test(swatch)
}

export function findBookColor(colors: Book['colors'], colorId: string | null | undefined): BookColor | null {
  if (!colorId) return null
  return (colors ?? []).find((color) => color.id === colorId) ?? null
}

export type ColorChoice = { ok: true; color: BookColor | null } | { ok: false }

/**
 * What a visitor's colour request means for this book. A book with colours
 * cannot be bought without choosing one of them, and a book without colours
 * cannot be bought "in" one — either mismatch is a stale page or a tampered
 * request, never an order to take.
 */
export function chooseColor(colors: Book['colors'], requestedColorId: string | null | undefined): ColorChoice {
  if (!colors || colors.length === 0) return requestedColorId ? { ok: false } : { ok: true, color: null }
  const color = findBookColor(colors, requestedColorId)
  return color ? { ok: true, color } : { ok: false }
}

/** The name an order line is sold under: the colour is part of what the packer must send. */
export function titleWithColor(title: string, color: Pick<BookColor, 'name'> | null): string {
  return color ? `${title}${COLOR_NAME_SEPARATOR}${color.name}` : title
}

/** Two cart lines are the same line only when both the book and its colour match. */
export function isSameCartLine(
  line: { bookId: number; colorId?: string | null },
  other: { bookId: number; colorId?: string | null },
): boolean {
  return line.bookId === other.bookId && (line.colorId ?? null) === (other.colorId ?? null)
}
