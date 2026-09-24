// Legacy ramhal.com pages that have a real equivalent on the current site, decided from
// the content of each page (scripts/scrape/out/he.json), not from its title or file name.
// Paths are as crawled, decoded. Every path is checked against the crawl by
// generate-legacy-redirects.mjs, so a typo fails the run.
//
// Left out on purpose, so they get a real 404 (docs/DECISIONS.md §18):
//   - essays and articles (§14), the shop cart, and pages whose body is empty;
//   - the institute description (/מכון-רמח-ל), contact (/צור-קשר), the mp3 archive (/mp3) and
//     the CD/DVD listing (/CD-DVD.html): the owner decided none of them is carried over.
export const PAGE_EQUIVALENCES = {
  catalogue: ['/ספרים.html', '/ספרים-בצרפתית.html', '/ספרים-באנגלית.html', '/Category.html'],
  ramhal: ['/הרמח-ל.html', '/תולדות-הרמח-ל.html', '/תולדות-הרמח-ל-1-1.html', '/רמח-ל-ותורתו.html'],
  beitRamhal: ['/בית-רמח-ל.html'],
  rabbiChriqui: ['/הרב-מרדכי-שריקי-שליט-א.html'],
  donate: ['/לתרומות-להדפסת-הספרים-ואחזקת-הכולל-1.html'],
  courses: [
    '/שיעורים-מוקלטים.html',
    '/שיעורים-על-חגים.html',
    '/תיקונים-חדשים-לרמח-ל-תיקוני-זוהר-תינייא.html',
    '/קנאת-ה-צבאות-לצפייה-ישירה.html',
    '/קל-ח-פתחי-חכמה-לצפייה.html',
    '/כללים-ראשונים-צפייה-ישירה.html',
    '/דעת-תבונות-לרמח-ל-לצפייה.html',
    '/מאמר-הגאולה-לרמח-ל-לצפייה.html',
  ],
  // An essay about one book, not an essay on a subject: the book's own page.
  books: { '/על-הספר-מחול-לצדיקים.html': 'מחול-לצדיקים-בדברי-תכלית-הבריאה' },
}
