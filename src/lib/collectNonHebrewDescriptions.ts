import type { Field } from 'payload'

const HEBREW_LETTER = /[א-ת]/g
const LATIN_LETTER = /[A-Za-z]/g

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0
}

/** A hint may quote a Latin word ("URL", a video id) but must be written in Hebrew. */
function isWrittenInHebrew(text: string): boolean {
  return countMatches(text, HEBREW_LETTER) > countMatches(text, LATIN_LETTER)
}

/**
 * Walks a field tree (arrays, groups, rows, tabs and the fields inside every
 * block) and returns one message per hint that is not written in Hebrew. The
 * only editor is Hebrew-speaking (docs/DECISIONS.md §3); a developer's note
 * left in a field's `admin.description` shows up on his form as English text
 * inside a right-to-left page, which is both unreadable to him and rendered
 * out of order by the bidirectional algorithm.
 */
export function collectNonHebrewDescriptions(fields: Field[], trail: string): string[] {
  const issues: string[] = []

  for (const field of fields) {
    const name = 'name' in field ? field.name : undefined
    const here = name ? `${trail}.${name}` : trail

    const admin = 'admin' in field ? field.admin : undefined
    const description = admin && 'description' in admin ? admin.description : undefined
    if (typeof description === 'string' && !isWrittenInHebrew(description)) {
      issues.push(`${here}: description is not written in Hebrew`)
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      issues.push(...collectNonHebrewDescriptions(field.fields, here))
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        issues.push(...collectNonHebrewDescriptions(tab.fields, here))
      }
    }

    if (field.type === 'blocks') {
      for (const block of field.blocks) {
        issues.push(...collectNonHebrewDescriptions(block.fields, `${here}.${block.slug}`))
      }
    }
  }

  return issues
}
