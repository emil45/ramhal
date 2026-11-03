// Editors paste whatever the browser's address bar shows. These helpers reduce
// that to the bare identifiers the site stores, and build the links from them.

const YOUTUBE_HOSTNAMES = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']
const SHORT_LINK_HOSTNAME = 'youtu.be'
const VIDEO_PATH_PREFIXES = ['embed', 'shorts', 'live']

// Video identifiers are always 11 characters; playlist identifiers are longer,
// which is what lets a bare pasted identifier be told apart from the other kind.
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/
const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{13,64}$/

const INVALID_PLAYLIST_MESSAGE = 'יש להדביק את הקישור לפלייליסט ביוטיוב, כפי שהוא מופיע בשורת הכתובת.'
const INVALID_VIDEO_MESSAGE = 'יש להדביק את הקישור לסרטון ביוטיוב, כפי שהוא מופיע בשורת הכתובת.'

function parseYoutubeUrl(input: string): URL | null {
  try {
    const url = new URL(input)
    const isYoutube = url.protocol === 'https:' && (YOUTUBE_HOSTNAMES.includes(url.hostname) || url.hostname === SHORT_LINK_HOSTNAME)
    return isYoutube ? url : null
  } catch {
    return null
  }
}

/** The playlist identifier from a pasted playlist or playlist-video link, or an identifier on its own. */
export function parsePlaylistId(input: string): string | null {
  const text = input.trim()
  if (PLAYLIST_ID_PATTERN.test(text)) return text

  const listId = parseYoutubeUrl(text)?.searchParams.get('list') ?? ''
  return PLAYLIST_ID_PATTERN.test(listId) ? listId : null
}

/** The video identifier from a pasted watch, short or embed link, or an identifier on its own. */
export function parseVideoId(input: string): string | null {
  const text = input.trim()
  if (VIDEO_ID_PATTERN.test(text)) return text

  const url = parseYoutubeUrl(text)
  if (!url) return null

  const [firstSegment, secondSegment] = url.pathname.split('/').filter(Boolean)
  let candidate: string | null | undefined = url.searchParams.get('v')
  if (url.hostname === SHORT_LINK_HOSTNAME) candidate = firstSegment
  else if (firstSegment !== undefined && VIDEO_PATH_PREFIXES.includes(firstSegment)) candidate = secondSegment

  return candidate && VIDEO_ID_PATTERN.test(candidate) ? candidate : null
}

/** An already-recognised value becomes its bare identifier; anything else is left for validation to reject. */
export function normalisePlaylistReference(value: unknown): unknown {
  return typeof value === 'string' ? (parsePlaylistId(value) ?? value) : value
}

export function normaliseVideoReference(value: unknown): unknown {
  return typeof value === 'string' ? (parseVideoId(value) ?? value) : value
}

export function validatePlaylistReference(value: unknown): true | string {
  return typeof value === 'string' && PLAYLIST_ID_PATTERN.test(value) ? true : INVALID_PLAYLIST_MESSAGE
}

export function validateVideoReference(value: unknown): true | string {
  return typeof value === 'string' && VIDEO_ID_PATTERN.test(value) ? true : INVALID_VIDEO_MESSAGE
}

export function playlistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`
}

/** A watch link that keeps the playlist, so YouTube plays on to the next lesson. */
export function playlistVideoUrl(videoId: string, playlistId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}`
}

export function videoThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}
