// Presentation rules for a book cover. Kept out of the components so the
// rules can be read, and tested, in one place — see docs/DESIGN.md.

/** Every cover is portrait 2:3, whatever it holds, so a grid row is level. */
export const COVER_ASPECT_RATIO = 2 / 3

/**
 * The frame's rule colour is the only thing a cover says about its
 * category: same paper, same ink, same frame — a differently coloured
 * rule. Values are brand tokens from globals.css, never a new colour.
 */
const RULE_COLOUR_BY_CATEGORY: Record<string, string> = {
  'hebrew-books': 'var(--teal)',
  'french-books': 'var(--gold)',
  'english-books': 'var(--teal-deep)',
  'siddurim-machzorim': 'var(--gold-ink)',
}

const DEFAULT_RULE_COLOUR = 'var(--teal)'

export function coverRuleColour(categorySlug: string | null | undefined): string {
  if (!categorySlug) return DEFAULT_RULE_COLOUR
  return RULE_COLOUR_BY_CATEGORY[categorySlug] ?? DEFAULT_RULE_COLOUR
}

/**
 * Title size as a percentage of the cover's own width (CSS `cqw`), stepping
 * down as the title lengthens so that even a long title fits its four-line
 * allowance. Relative to the cover, not the viewport, so a thumbnail in the
 * cart is a faithful miniature of the cover on the book page.
 */
const TITLE_SIZE_STEPS: { maximumLength: number; widthPercent: number }[] = [
  { maximumLength: 12, widthPercent: 13 },
  { maximumLength: 24, widthPercent: 11 },
  { maximumLength: 44, widthPercent: 9 },
  { maximumLength: 80, widthPercent: 7.5 },
]

const SMALLEST_TITLE_WIDTH_PERCENT = 6.5

export function coverTitleWidthPercent(title: string): number {
  const length = title.trim().length
  const step = TITLE_SIZE_STEPS.find(({ maximumLength }) => length <= maximumLength)
  return step ? step.widthPercent : SMALLEST_TITLE_WIDTH_PERCENT
}
