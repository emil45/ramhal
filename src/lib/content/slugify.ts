/**
 * Turns a title into a URL-safe slug. Keeps Hebrew, French and Latin letters —
 * this only needs to be readable and stable, not ASCII-only, since the frontend
 * router percent-encodes non-ASCII path segments itself.
 */
export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '') // strip Hebrew niqqud/cantillation
    .replace(/["'׳״]/g, '') // strip gershayim/geresh and quote marks
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}
