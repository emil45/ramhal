export const SOCIAL_PLATFORMS = ['facebook', 'youtube'] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export type SocialLink = {
  platform: SocialPlatform
  url: string
}

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: 'facebook', url: 'https://www.facebook.com/RamhalInstitute' },
  { platform: 'youtube', url: 'https://www.youtube.com/user/RamhalInstit' },
]

const INVALID_URL_MESSAGE = 'יש להזין כתובת מלאה ומאובטחת שמתחילה ב־https://'
const INVALID_LINKS_MESSAGE = 'יש לבחור כל רשת פעם אחת ולהזין כתובת השייכת לרשת שנבחרה'

function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === 'string' && SOCIAL_PLATFORMS.some((platform) => platform === value)
}

function parseSecureUrl(value: unknown): URL | null {
  if (typeof value !== 'string' || value === '') return null

  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname ? url : null
  } catch {
    return null
  }
}

function belongsToPlatform(url: URL, platform: SocialPlatform): boolean {
  const hostname = url.hostname.toLowerCase()
  const hasAccountPath = url.pathname !== '/'

  if (!hasAccountPath) return false
  if (platform === 'facebook') return hostname === 'facebook.com' || hostname.endsWith('.facebook.com')
  return hostname === 'youtube.com' || hostname.endsWith('.youtube.com')
}

function parseSocialLink(value: unknown): SocialLink | null {
  if (!value || typeof value !== 'object' || !('platform' in value) || !('url' in value)) return null
  if (!isSocialPlatform(value.platform)) return null

  const url = parseSecureUrl(value.url)
  if (!url || !belongsToPlatform(url, value.platform)) return null

  return { platform: value.platform, url: url.toString().replace(/\/$/, '') }
}

export function validateSocialLinkUrl(value: unknown): true | string {
  if (value === undefined || value === null || value === '') return true
  return parseSecureUrl(value) ? true : INVALID_URL_MESSAGE
}

export function validateSocialLinks(value: unknown): true | string {
  if (value === undefined || value === null) return true
  if (!Array.isArray(value)) return INVALID_LINKS_MESSAGE

  const links = value.map(parseSocialLink)
  if (links.some((link) => link === null)) return INVALID_LINKS_MESSAGE

  const platforms = links.flatMap((link) => (link ? [link.platform] : []))
  return new Set(platforms).size === platforms.length ? true : INVALID_LINKS_MESSAGE
}

export function resolveSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    const link = parseSocialLink(entry)
    return link ? [link] : []
  })
}

export function socialLinkForPlatform(links: SocialLink[], platform: SocialPlatform): SocialLink | undefined {
  return links.find((link) => link.platform === platform)
}

export function youtubePlaylistsUrl(channelUrl: string): string {
  const url = new URL(channelUrl)
  url.search = ''
  url.hash = ''
  const pathname = url.pathname.replace(/\/$/, '')
  url.pathname = pathname.endsWith('/playlists') ? pathname : `${pathname}/playlists`
  return url.toString().replace(/\/$/, '')
}
