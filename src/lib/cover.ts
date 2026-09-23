// Presentation rules for a book cover. Kept out of the components so the
// rules can be read, and tested, in one place — see docs/DESIGN.md.

import type { Book } from '@/payload-types'

/** Every cover is portrait 2:3, whatever it holds, so a grid row is level. */
export const COVER_ASPECT_RATIO = 2 / 3

// siddurim-machzorim is the only category that still overrides the rule
// colour (docs/DECISIONS.md §13) — named here rather than imported from
// data, since it's a presentation rule, not a lookup.
const SIDDURIM_CATEGORY_SLUG = 'siddurim-machzorim'

/** The minimal shape the cover components need to pick a rule colour —
 * shared by CoverFrame, TypographicCover and CoverImage so each doesn't
 * declare its own prop list. */
export type CoverIdentity = {
  bookLanguage: Book['bookLanguage']
  categorySlug: string | null | undefined
}

/**
 * The frame's rule colour is the only thing a cover says about its shelf:
 * same paper, same ink, same frame — a differently coloured rule. Values
 * are brand tokens from globals.css, never a new colour. Language, not
 * category, carries this for every book except a siddur/machzor — see
 * docs/DECISIONS.md §13 (a category used to duplicate language for
 * hebrew-books/french-books/english-books; that duplication is gone).
 */
const RULE_COLOUR_BY_LANGUAGE: Partial<Record<Book['bookLanguage'], string>> = {
  he: 'var(--teal)',
  fr: 'var(--gold)',
  en: 'var(--teal-deep)',
}

const DEFAULT_RULE_COLOUR = 'var(--teal)'

export function coverRuleColour({ bookLanguage, categorySlug }: CoverIdentity): string {
  if (categorySlug === SIDDURIM_CATEGORY_SLUG) return 'var(--gold-ink)'
  return RULE_COLOUR_BY_LANGUAGE[bookLanguage] ?? DEFAULT_RULE_COLOUR
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
