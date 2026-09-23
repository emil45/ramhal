import { describe, expect, it } from 'vitest'

import { assertMediaWritable, getPublicMediaUrl, readMediaStorageSettings } from '@/lib/mediaStorage'

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
      access: 'read-write',
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

  it('reads S3_PUBLIC_URL alone as read-only', () => {
    expect(readMediaStorageSettings({ S3_PUBLIC_URL: 'https://pub.example.r2.dev/' })).toEqual({
      access: 'read-only',
      publicUrl: 'https://pub.example.r2.dev',
    })
  })

  it('still refuses a half-configured bucket when other variables accompany the public URL', () => {
    expect(() => readMediaStorageSettings({ S3_PUBLIC_URL: 'https://pub.example.r2.dev', S3_BUCKET: 'covers' })).toThrow(/half-configured/)
  })

  it('builds a direct public URL without losing a nested prefix', () => {
    expect(getPublicMediaUrl('https://media.example.org/', 'books/hebrew', 'cover image.png')).toBe(
      'https://media.example.org/books/hebrew/cover%20image.png',
    )
  })
})

describe('assertMediaWritable', () => {
  it('refuses uploads in read-only mode with an explanation', () => {
    expect(() => assertMediaWritable({ access: 'read-only', publicUrl: 'https://pub.example.r2.dev' })).toThrow(/read-only/)
  })

  it('allows uploads to local disk and to a full bucket', () => {
    expect(() => assertMediaWritable(null)).not.toThrow()
    expect(() => assertMediaWritable(readMediaStorageSettings(ALL_SIX))).not.toThrow()
  })
})
