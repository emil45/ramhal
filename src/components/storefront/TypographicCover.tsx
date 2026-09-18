import { categoryTheme } from '@/lib/categoryTheme'

/**
 * A rendered cover, not an image file — 121 of 128 books have no scanned
 * cover (docs/tasks/TASK-06-storefront.md §5). Reads as a modest book cover:
 * the title, well set, on a ground coloured by category, framed by a thin
 * rule — never a placeholder box.
 */
export function TypographicCover({ categorySlug, title }: { categorySlug: string | null | undefined; title: string }) {
  const theme = categoryTheme(categorySlug)

  return (
    <div
      className="relative flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-sm p-4"
      style={{ backgroundColor: theme.background }}
    >
      <div className="absolute inset-2 rounded-[2px]" style={{ border: `1px solid ${theme.border}` }} aria-hidden />
      <p
        className="relative line-clamp-6 text-center font-serif text-base leading-snug font-medium break-words [text-wrap:balance]"
        style={{ color: theme.text }}
      >
        {title}
      </p>
    </div>
  )
}
