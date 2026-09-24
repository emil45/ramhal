// Legacy pages that have a real equivalent on the current site, decided from the
// content of each page (scripts/scrape/out/*.json), not from its title or file name:
// the French site's Beit-Ramhal.html is the institute description and
// Institute-Ramhal.html is the study hall, the English Ramhal-Institute-1.html is the
// Ramhal's biography. Paths are as crawled, decoded. Every path is checked against
// the crawl by generate-legacy-redirects.mjs, so a typo fails the run.
//
// Left out on purpose, so they get a real 404 (docs/DECISIONS.md §18):
//   - essays and articles (§14), the shop cart, and pages whose body is empty;
//   - the institute description (he /מכון-רמח-ל, en /Ramhal-Institute, fr /Beit-Ramhal):
//     no page of the new site is "about the institute" — see docs/reports/TASK-48.md, OPEN;
//   - contact pages (he /צור-קשר, en /צור-קשר-1, fr /צור-קשר-1-1): no contact page exists,
//     the details are in the footer — OPEN;
//   - the mp3 archive (he /mp3): not built yet (docs/DECISIONS.md §6).
export const PAGE_EQUIVALENCES = {
  he: {
    catalogue: ['/ספרים.html', '/ספרים-בצרפתית.html', '/ספרים-באנגלית.html', '/Category.html', '/CD-DVD.html'],
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
  },
  en: {
    catalogue: ['/Books-in-Hebrew.html', '/Books-in-French.html', '/Store.html', '/CD-DVD-1-1.html'],
    ramhal: ['/Ramhal-and-its-Tora.html', '/Ramhal-Institute-1.html'],
    beitRamhal: ['/Bait-Ramchal.html'],
    rabbiChriqui: [],
    donate: [],
    courses: ['/Recorded-Lectures.html'],
    books: {},
  },
  fr: {
    catalogue: ['/hébreu-Livres.html', '/Livres.html', '/Botiquw-en-ligne.html'],
    ramhal: ['/Le-Ramhal-at-son-enseignement.html'],
    beitRamhal: ['/Institute-Ramhal.html'],
    rabbiChriqui: ['/La-page-du-rav-Mordekhai-Chriqui.html'],
    donate: [],
    courses: ['/Cours-enregistres.html'],
    books: {},
  },
}
