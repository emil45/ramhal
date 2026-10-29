import { describe, expect, it } from 'vitest'

import {
  normalisePlaylistReference,
  normaliseVideoReference,
  parsePlaylistId,
  parseVideoId,
  playlistUrl,
  playlistVideoUrl,
  validatePlaylistReference,
  validateVideoReference,
  videoThumbnailUrl,
} from '@/lib/youtubeLinks'

const PLAYLIST_ID = 'PLI4WtgHMTlAfFGjt4FyO7CokQoy6t6B8v'
const VIDEO_ID = '4PY4qSHWN3I'

describe('playlist identifiers', () => {
  it('reads the identifier from a playlist link, a playlist-video link or the bare identifier', () => {
    expect(parsePlaylistId(`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`)).toBe(PLAYLIST_ID)
    expect(parsePlaylistId(`https://www.youtube.com/watch?v=${VIDEO_ID}&list=${PLAYLIST_ID}&index=3`)).toBe(PLAYLIST_ID)
    expect(parsePlaylistId(`  ${PLAYLIST_ID}  `)).toBe(PLAYLIST_ID)
  })

  it('rejects a video link without a playlist, a foreign site and a video identifier', () => {
    expect(parsePlaylistId(`https://www.youtube.com/watch?v=${VIDEO_ID}`)).toBeNull()
    expect(parsePlaylistId(`https://example.com/playlist?list=${PLAYLIST_ID}`)).toBeNull()
    expect(parsePlaylistId(VIDEO_ID)).toBeNull()
  })
})

describe('video identifiers', () => {
  it('reads the identifier from every link shape YouTube hands out', () => {
    expect(parseVideoId(`https://www.youtube.com/watch?v=${VIDEO_ID}&list=${PLAYLIST_ID}`)).toBe(VIDEO_ID)
    expect(parseVideoId(`https://youtu.be/${VIDEO_ID}?si=abc`)).toBe(VIDEO_ID)
    expect(parseVideoId(`https://www.youtube.com/embed/${VIDEO_ID}`)).toBe(VIDEO_ID)
    expect(parseVideoId(`https://m.youtube.com/shorts/${VIDEO_ID}`)).toBe(VIDEO_ID)
    expect(parseVideoId(VIDEO_ID)).toBe(VIDEO_ID)
  })

  it('rejects a playlist-only link, a foreign site and a malformed identifier', () => {
    expect(parseVideoId(`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`)).toBeNull()
    expect(parseVideoId(`https://example.com/watch?v=${VIDEO_ID}`)).toBeNull()
    expect(parseVideoId('https://www.youtube.com/watch?v=short')).toBeNull()
  })
})

describe('normalising what an editor pasted', () => {
  it('stores the bare identifier for a recognised link', () => {
    expect(normalisePlaylistReference(`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`)).toBe(PLAYLIST_ID)
    expect(normaliseVideoReference(`https://youtu.be/${VIDEO_ID}`)).toBe(VIDEO_ID)
  })

  it('leaves an unrecognised value for validation to reject, and an empty one alone', () => {
    expect(normaliseVideoReference('not a link')).toBe('not a link')
    expect(normalisePlaylistReference(undefined)).toBeUndefined()
  })
})

describe('validating a stored reference', () => {
  it('accepts identifiers and rejects anything else, including an empty value', () => {
    expect(validatePlaylistReference(PLAYLIST_ID)).toBe(true)
    expect(validateVideoReference(VIDEO_ID)).toBe(true)
    expect(validatePlaylistReference('not a link')).not.toBe(true)
    expect(validateVideoReference(`https://example.com/${VIDEO_ID}`)).not.toBe(true)
    expect(validateVideoReference(undefined)).not.toBe(true)
  })
})

describe('building links', () => {
  it('keeps the playlist on a first-lesson link so YouTube plays on to the next lesson', () => {
    expect(playlistVideoUrl(VIDEO_ID, PLAYLIST_ID)).toBe(`https://www.youtube.com/watch?v=${VIDEO_ID}&list=${PLAYLIST_ID}`)
    expect(playlistUrl(PLAYLIST_ID)).toBe(`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`)
    expect(videoThumbnailUrl(VIDEO_ID)).toBe(`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`)
  })
})
