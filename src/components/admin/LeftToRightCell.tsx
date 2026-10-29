import type { DefaultCellComponentProps } from 'payload'

/** A value written left to right — a phone number with a "+" and spaces — inside a right-to-left table.
 * Without its own direction the bidirectional algorithm reverses the groups ("+33 6 12 34" reads "34 12 6 33+"). */
export function LeftToRightCell({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== 'string' || !cellData) return null
  return <bdi dir="ltr">{cellData}</bdi>
}
