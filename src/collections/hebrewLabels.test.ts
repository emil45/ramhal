import type { CollectionConfig, GlobalConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import { collectMissingHebrewLabels } from '@/lib/collectMissingHebrewLabels'

import { Announcements } from './Announcements'
import { Articles } from './Articles'
import { Books } from './Books'
import { Categories } from './Categories'
import { Events } from './Events'
import { Lessons } from './Lessons'
import { Media } from './Media'
import { MockPaymentSessions } from './MockPaymentSessions'
import { Orders } from './Orders'
import { Pages } from './Pages'
import { PaymentEvents } from './PaymentEvents'
import { Series } from './Series'
import { Users } from './Users'
import { Schedule } from '../globals/Schedule'
import { ShippingSettings } from '../globals/ShippingSettings'
import { SiteSettings } from '../globals/SiteSettings'

const HEBREW = /[֐-׿]/

function isHebrewLabel(label: unknown): boolean {
  return typeof label === 'string' && HEBREW.test(label)
}

const collections: CollectionConfig[] = [
  Announcements,
  Articles,
  Books,
  Categories,
  Events,
  Lessons,
  Media,
  MockPaymentSessions,
  Orders,
  Pages,
  PaymentEvents,
  Series,
  Users,
]

const globals: GlobalConfig[] = [Schedule, ShippingSettings, SiteSettings]

describe('every collection has Hebrew admin labels', () => {
  it.each(collections)('$slug', (collection) => {
    expect(isHebrewLabel(collection.labels?.singular)).toBe(true)
    expect(isHebrewLabel(collection.labels?.plural)).toBe(true)
    expect(collectMissingHebrewLabels(collection.fields, collection.slug)).toEqual([])
  })
})

describe('every global has Hebrew admin labels', () => {
  it.each(globals)('$slug', (global) => {
    expect(isHebrewLabel(global.label)).toBe(true)
    expect(collectMissingHebrewLabels(global.fields, global.slug)).toEqual([])
  })
})
