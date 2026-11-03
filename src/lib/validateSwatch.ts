import { text } from 'payload/shared'

import { isValidSwatch } from './bookColors.ts'

import type { TextFieldSingleValidation } from 'payload'

/** Payload's own `text` validation (so `required` still applies) plus the colour format. */
export const validateSwatch: TextFieldSingleValidation = (value, options) => {
  const textResult = text(value, options)
  if (textResult !== true) return textResult
  return typeof value === 'string' && isValidSwatch(value) ? true : 'יש לבחור גוון תקין.'
}
