import { describe, expect, it } from 'vitest'

import {
  resolveSocialLinks,
  socialLinkForPlatform,
  validateSocialLinks,
  youtubePlaylistsUrl,
} from './socialLinks'

describe('social links', () => {
  const facebook = { platform: 'facebook', url: 'https://www.facebook.com/RamhalInstitute' }
  const youtube = { platform: 'youtube', url: 'https://www.youtube.com/user/RamhalInstit' }

  it('accepts one account URL for each supported platform', () => {
    expect(validateSocialLinks([facebook, youtube])).toBe(true)
  })

  it('rejects duplicate platforms', () => {
    expect(validateSocialLinks([facebook, { ...facebook, url: 'https://facebook.com/another-page' }])).not.toBe(true)
  })

  it('rejects a URL that does not belong to its selected platform', () => {
    expect(validateSocialLinks([{ platform: 'youtube', url: facebook.url }])).not.toBe(true)
  })

  it('rejects insecure and unsupported account URLs', () => {
    expect(validateSocialLinks([{ platform: 'facebook', url: 'http://facebook.com/RamhalInstitute' }])).not.toBe(true)
    expect(validateSocialLinks([{ platform: 'instagram', url: 'https://instagram.com/ramhal' }])).not.toBe(true)
  })

  it('filters malformed persisted values before rendering', () => {
    const links = resolveSocialLinks([youtube, { platform: 'facebook', url: 'javascript:alert(1)' }])

    expect(links).toEqual([youtube])
    expect(socialLinkForPlatform(links, 'youtube')).toEqual(youtube)
  })

  it('builds the playlists destination from either supported YouTube account URL style', () => {
    expect(youtubePlaylistsUrl(youtube.url)).toBe('https://www.youtube.com/user/RamhalInstit/playlists')
    expect(youtubePlaylistsUrl('https://www.youtube.com/@ramhalInstit/')).toBe(
      'https://www.youtube.com/@ramhalInstit/playlists',
    )
    expect(youtubePlaylistsUrl('https://www.youtube.com/@ramhalInstit/playlists')).toBe(
      'https://www.youtube.com/@ramhalInstit/playlists',
    )
  })
})
