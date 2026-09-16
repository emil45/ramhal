// Where the crawl starts.
//
// Note: sitemap.xml returns HTTP 500 on all three hosts. The real sitemap is
// an .asp endpoint, discovered via robots.txt. All three sites share the same
// account id (depart_id=367044) — they are one installation on three domains.

export const SITES = {
  he: {
    label: 'Hebrew — ramhal.com',
    origin: 'https://www.ramhal.com',
    sitemap: 'https://www.ramhal.com/sitemap.asp?depart_id=367044',
    currency: 'ILS',
  },
  fr: {
    label: 'French — frramhal.com',
    origin: 'https://www.frramhal.com',
    sitemap: 'https://www.frramhal.com/sitemap.asp?depart_id=367044',
    currency: 'EUR',
  },
  en: {
    label: 'English (nominally) — enramhal.com',
    origin: 'https://www.enramhal.com',
    sitemap: 'https://www.enramhal.com/sitemap.asp?depart_id=367044',
    currency: 'USD',
  },
};

// Store category pagination. The .html category pages ignore ?iPageNum — real
// pagination lives at this endpoint. Hebrew books run to 3 pages of ~21 items.
export const PAGINATION = (origin, detailId, page) =>
  `${origin}/site/detail/detail/detailDetail.asp?detail_id=${detailId}&iPageNum=${page}&seaWord=`;

// Sample mode: a deliberately awkward selection, not a tidy one.
//
// These are the cases that break naive scrapers and naive content models, so
// the prototype should be built against them rather than against easy pages:
//
//   - NOUVEAU.html       Noa'h's essay, living under a completely unrelated slug
//   - emor.html          a real essay with NO title line at all
//   - vayera.html        the longest essay on any site (~8,500 words)
//   - devarim.html       a page that exists and is entirely empty
//   - Hanouka.html       an essay about Kippour. The filename lies.
//   - Articles-KABBALE   a live nav item reading "EN CONSTRUCTION"
//
// Latin-slug URLs are listed literally because they were verified by hand.
// Hebrew URLs are NOT hardcoded — they are discovered from the sitemap, because
// hand-writing percent-encoded Hebrew is how you introduce silent 404s.
export const SAMPLE_EXPLICIT = {
  fr: [
    '/',
    '/vayera.html',
    '/emor.html',
    '/NOUVEAU.html',
    '/devarim.html',
    '/Hanouka.html',
    '/Articles-KABBALE.html',
    '/La-Voie-de-D-ieu.html',
    '/tikoun-olam.html',
    '/LA-PARASHA-SELON-LA-KABBALE.html',
    '/Le-Ramhal-at-son-enseignement.html',
    '/Botiquw-en-ligne.html',
    '/Livres.html',
  ],
  en: ['/', '/Ramhal-Institute.html', '/Ramhal-and-its-Tora.html', '/Store.html', '/BOOKS.html'],
  he: ['/', '/Category.html'],
};

// For Hebrew, pick sample pages out of the sitemap by matching the *decoded*
// slug — we decode only to decide, never to build the URL we request.
export const SAMPLE_HE_MATCHES = [
  'מסילת',        // a mid-price flagship title
  'זוהר',          // the ₪300 end of the catalogue
  'דרך-חכמה',     // the ₪15 end
  'תולדות',        // the Ramhal biography
  'מכון',          // the institute page
  'בית',           // Beit Ramhal
  'הזוהר',         // the 8,000-word article
  'הרב',           // Rabbi Chriqui's page
];
