#!/usr/bin/env vite-node
// One-time editorial cleanup for TASK-35. The legacy description of this
// exact edition starts with bibliographic facts and ends by sending the reader
// to ramhal.com to buy the book. The schema now has proper fields for those
// facts, so this moves them there and leaves the substantive review as the
// description. Identity and source-shape checks deliberately abort instead of
// adapting if the catalogue has changed since the audit.

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config.ts')

const TARGET = {
  urlSlug: 'מחול-לצדיקים-בדברי-תכלית-הבריאה',
  importKey: 'מחול לצדיקים (בדברי תכלית הבריאה)',
  title: 'מחול לצדיקים (בדברי תכלית הבריאה)',
}

const DESCRIPTION_START = 'בצלאל נאור הוא חוקר מחשבת ישראל.'
const LEGACY_SALES_LINE = 'הספר למכירה באתר : מכון רמח"ל: www.ramhal.com'

const BIBLIOGRAPHIC_DATA = {
  subtitle: 'מחלוקת רמח״ל ור׳ אייזיק מהומל בדבר תכלית הבריאה',
  creatorCredit: 'הרב בצלאל נאור',
  publicationPlace: 'ירושלים',
  publisherName: 'מכון רמח״ל ואורות',
  hebrewYear: 'תשע״ו',
  extent: '256 עמ׳ בעברית; 3 עמ׳ באנגלית (תקציר); 8 עמ׳ פקסימיליות',
  endorsementCredits: 'הרב משה צוריאל; הרב מרדכי שריקי; הרב ד״ר צבי לשם',
}

function singleParagraphText(description) {
  const paragraphs = description?.root?.children
  if (!Array.isArray(paragraphs) || paragraphs.length !== 1 || paragraphs[0]?.type !== 'paragraph') {
    throw new Error('Expected the audited description to contain exactly one paragraph.')
  }

  const textNodes = paragraphs[0].children
  if (!Array.isArray(textNodes) || textNodes.length !== 1 || textNodes[0]?.type !== 'text' || typeof textNodes[0].text !== 'string') {
    throw new Error('Expected the audited description paragraph to contain exactly one text node.')
  }

  return textNodes[0].text
}

function cleanDescription(description) {
  const current = singleParagraphText(description)
  const substantiveStart = current.indexOf(DESCRIPTION_START)
  if (substantiveStart === -1) {
    throw new Error(`Description no longer contains the audited substantive opening: ${DESCRIPTION_START}`)
  }

  const salesLineStart = current.indexOf(LEGACY_SALES_LINE)
  if (salesLineStart !== -1 && salesLineStart < substantiveStart) {
    throw new Error('The legacy sales line appears before the substantive review; refusing to rewrite unexpected content.')
  }

  return current.slice(substantiveStart, salesLineStart === -1 ? undefined : salesLineStart).trim()
}

function toLexicalRichText(text) {
  return {
    root: {
      type: 'root',
      direction: 'rtl',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          direction: 'rtl',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          version: 1,
          children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
        },
      ],
    },
  }
}

const payload = await getPayload({ config })

try {
  const result = await payload.find({
    collection: 'books',
    locale: 'he',
    fallbackLocale: false,
    depth: 0,
    overrideAccess: true,
    where: { urlSlug: { equals: TARGET.urlSlug } },
    limit: 2,
  })

  if (result.totalDocs !== 1) {
    throw new Error(`Expected exactly one book with urlSlug ${TARGET.urlSlug}; found ${result.totalDocs}.`)
  }

  const book = result.docs[0]
  if (book.title !== TARGET.title || book.importKey !== TARGET.importKey) {
    throw new Error(
      `Target identity changed: expected title/importKey ${TARGET.title}; found ${book.title} / ${book.importKey}.`,
    )
  }

  const description = cleanDescription(book.description)
  const updated = await payload.update({
    collection: 'books',
    id: book.id,
    locale: 'he',
    fallbackLocale: false,
    overrideAccess: true,
    data: {
      ...BIBLIOGRAPHIC_DATA,
      description: toLexicalRichText(description),
    },
  })

  const persistedDescription = singleParagraphText(updated.description)
  if (persistedDescription !== description || persistedDescription.includes(LEGACY_SALES_LINE)) {
    throw new Error('The cleaned description did not persist exactly as expected.')
  }

  for (const [field, expected] of Object.entries(BIBLIOGRAPHIC_DATA)) {
    if (updated[field] !== expected) {
      throw new Error(`Field ${field} did not persist: expected ${expected}; found ${updated[field]}.`)
    }
  }

  console.log(JSON.stringify({ id: updated.id, urlSlug: updated.urlSlug, descriptionCharacters: description.length }, null, 2))
} finally {
  await payload.destroy()
}

process.exit(0)
