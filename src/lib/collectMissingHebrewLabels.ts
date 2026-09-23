import type { Field } from 'payload'

const HEBREW = /[֐-׿]/

function isHebrewLabel(label: unknown): boolean {
  return typeof label === 'string' && HEBREW.test(label)
}

/**
 * Walks a field tree (recursing into arrays, groups, rows, tabs — anything
 * with nested `fields`) and returns one message per data-bearing field, or
 * array, missing a Hebrew label. There is one Hebrew-speaking admin persona
 * (docs/DECISIONS.md §3), so every label an editor sees must be Hebrew —
 * this is the check that fails when someone adds a field without one,
 * instead of relying on a reviewer to notice.
 */
export function collectMissingHebrewLabels(fields: Field[], trail: string): string[] {
  const issues: string[] = []

  for (const field of fields) {
    const name = 'name' in field ? field.name : undefined
    const here = name ? `${trail}.${name}` : trail

    if (name && !isHebrewLabel('label' in field ? field.label : undefined)) {
      issues.push(`${here}: missing a Hebrew label`)
    }

    if (field.type === 'array' && (!isHebrewLabel(field.labels?.singular) || !isHebrewLabel(field.labels?.plural))) {
      issues.push(`${here}: array is missing Hebrew labels.singular/labels.plural`)
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      issues.push(...collectMissingHebrewLabels(field.fields as Field[], here))
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        issues.push(...collectMissingHebrewLabels(tab.fields, here))
      }
    }
  }

  return issues
}
