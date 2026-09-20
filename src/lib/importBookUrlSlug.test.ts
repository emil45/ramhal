import { describe, expect, it } from 'vitest'

import { getImportBookUrlSlug } from '@/lib/importBookUrlSlug'

describe('getImportBookUrlSlug', () => {
  it.each([
    [
      'זוהר רשבי חב - פרשת נח, לך לך, וירא, - בהוצאת מכון רמחל',
      'זוהר-רשבי-חב-פרשת-נח-לך-לך-וירא-בהוצאת-מכון-רמחל-2',
    ],
    ['la kabbale de la reparation', 'la-kabbale-de-la-reparation-2'],
    ['fr:דברות רמחל חה משיח', 'דברות-רמחל-חה-משיח-2'],
  ])('preserves the reviewed canonical URL for %s', (importKey, expected) => {
    expect(getImportBookUrlSlug(importKey)).toBe(expected)
  })

  it('lets Payload generate the slug for every non-colliding import', () => {
    expect(getImportBookUrlSlug('מסילת ישרים')).toBeUndefined()
  })
})
