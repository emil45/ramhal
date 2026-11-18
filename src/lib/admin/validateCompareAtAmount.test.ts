import { describe, expect, it } from 'vitest'

import { isHigherThanSellingPrice } from './validateCompareAtAmount'

describe('isHigherThanSellingPrice', () => {
  it('accepts an empty earlier price, which means no sale', () => {
    expect(isHigherThanSellingPrice(null, 60)).toBe(true)
    expect(isHigherThanSellingPrice(undefined, 60)).toBe(true)
  })

  it('accepts an earlier price above the selling price', () => {
    expect(isHigherThanSellingPrice(90, 60)).toBe(true)
  })

  it('rejects an earlier price equal to or below the selling price', () => {
    expect(isHigherThanSellingPrice(60, 60)).toBe(false)
    expect(isHigherThanSellingPrice(50, 60)).toBe(false)
  })

  it('leaves the comparison to the selling price field while that is still empty', () => {
    expect(isHigherThanSellingPrice(90, undefined)).toBe(true)
  })
})
