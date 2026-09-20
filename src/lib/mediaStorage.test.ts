import { describe, expect, it } from 'vitest'

import { getPublicMediaUrl, readMediaStorageSettings } from '@/lib/mediaStorage'

const ALL_SIX = {
  S3_ACCESS_KEY_ID: 'key',
  S3_BUCKET: 'covers',
  S3_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
  S3_PUBLIC_URL: 'https://media.example.org/',
  S3_REGION: 'auto',
  S3_SECRET_ACCESS_KEY: 'secret',
}

describe('readMediaStorageSettings', () => {
  it('means local disk when no bucket is configured', () => {
    expect(readMediaStorageSettings({})).toBeNull()
  })

  it('reads a fully configured bucket', () => {
    expect(readMediaStorageSettings(ALL_SIX)).toEqual({
      accessKeyId: 'key',
      bucket: 'covers',
      endpoint: 'https://example.r2.cloudflarestorage.com',
      publicUrl: 'https://media.example.org',
      region: 'auto',
      secretAccessKey: 'secret',
    })
  })

  it('refuses a half-configured bucket, naming what is missing, rather than fall back to local disk', () => {
    expect(() => readMediaStorageSettings({ ...ALL_SIX, S3_SECRET_ACCESS_KEY: undefined })).toThrow(/S3_SECRET_ACCESS_KEY/)
  })

  it('treats an empty value as unset', () => {
    expect(() => readMediaStorageSettings({ ...ALL_SIX, S3_BUCKET: '' })).toThrow(/S3_BUCKET/)
  })

  it('builds a direct public URL without losing a nested prefix', () => {
    expect(getPublicMediaUrl('https://media.example.org/', 'books/hebrew', 'cover image.png')).toBe(
      'https://media.example.org/books/hebrew/cover%20image.png',
    )
  })
})
