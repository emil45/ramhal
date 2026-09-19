// The legacy shop sold shiur recordings on CD and DVD, some filed under its
// CD/DVD shelf and many not — hence a title check as well as a shelf check.
// The institute no longer sells them online (see importBooks.ts).
const RECORDED_MEDIA_WORDS = /\b(?:cd|cds|dvd|dvds|mp3)\b|תקליטור|דיסק|קלטת/i

export function isRecordedMediaTitle(title: string): boolean {
  return RECORDED_MEDIA_WORDS.test(title)
}
