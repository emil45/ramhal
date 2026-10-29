import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// The courses page and the book pages' lessons box were curated in code until
// the lessons became editable in the admin. This carries that curated list
// into the database so the cut-over changes nothing the visitor sees.
//
// A book is linked by its urlSlug, the only identifier stable across
// databases; a slug with no book (a local database without the full catalogue)
// is skipped rather than failing the migration.

const COURSES = [
  {
    title: { he: 'דעת תבונות', en: 'Daat Tevunot', fr: 'Daat Tevounot' },
    lessonCount: 52,
    playlistId: 'PLI4WtgHMTlAfkJTDMLytz2F8ZjesjKrHj',
    firstLessonVideoId: '6Qe6-HIMYwg',
    bookUrlSlugs: ['דעת-תבונות', 'דעת-תבונות-צרפתית-עברית'],
  },
  {
    title: { he: 'דרך ה׳', en: 'Derech Hashem', fr: 'Derekh Hachem' },
    lessonCount: 114,
    playlistId: 'PLI4WtgHMTlAcMcyA61GyLY50OcIWCWyKt',
    firstLessonVideoId: 'P0d06W8B_ME',
    bookUrlSlugs: ['דרך-ה-עם-פירוש-דרך-היחוד', 'דרך-השם-צרפתית-עברית'],
  },
  {
    title: { he: 'קל״ח פתחי חכמה', en: 'Kalach Pitchei Chochma', fr: 'Kala’h Pit’hé Hokhma' },
    lessonCount: 135,
    playlistId: 'PLI4WtgHMTlAc0TX_0fy57GeHHatGFz_8t',
    firstLessonVideoId: 'JZRG0z6YL5A',
    bookUrlSlugs: ['קלח-פתחי-חכמה', 'קלח-פתחי-חכמה-צרפתית-עברית'],
  },
  {
    title: { he: 'פינות המרכבה', en: 'Pinot HaMerkava', fr: 'Pinot HaMerkava' },
    lessonCount: 27,
    playlistId: 'PLI4WtgHMTlAccFS82ct85NsknLQ4WKmnv',
    firstLessonVideoId: 'Ld1F0C0tBYE',
    bookUrlSlugs: ['פינות-המרכבה'],
  },
  {
    title: { he: 'משכני עליון', en: 'Mishkenei Elyon', fr: 'Michkené Elyon' },
    lessonCount: 2,
    playlistId: 'PLI4WtgHMTlAf9UBHF6iC7piUZM64ovwv4',
    firstLessonVideoId: 'nvp9cdefYdY',
    bookUrlSlugs: ['משכני-עליון'],
  },
  {
    title: { he: 'אדיר במרום', en: 'Adir BaMarom', fr: 'Adir BaMarom' },
    lessonCount: 208,
    playlistId: 'PLI4WtgHMTlAfFGjt4FyO7CokQoy6t6B8v',
    firstLessonVideoId: '4PY4qSHWN3I',
    bookUrlSlugs: ['אדיר-במרום-הוצאת-מכון-רמחל'],
  },
  {
    title: { he: 'תיקונים חדשים', en: 'Tikunim Hadashim', fr: 'Tikounim Hadachim' },
    lessonCount: 114,
    playlistId: 'PLI4WtgHMTlAe-YrTemz4s9vpafXi3FFv2',
    firstLessonVideoId: 'K154opViCGE',
    bookUrlSlugs: ['תיקונים-חדשים', 'תיקונים-חדשים-ארמית-צרפתית'],
  },
  {
    title: { he: 'רזין גניזין', en: 'Razin Genizin', fr: 'Razin Guenizin' },
    lessonCount: 58,
    playlistId: 'PLI4WtgHMTlAcH4U3VsIyd-tJp61ZvXjn8',
    firstLessonVideoId: 'NNYSdzoZV8A',
    bookUrlSlugs: ['רזין-גניזין-תשעו-2016'],
  },
  {
    title: { he: 'מאמר הגאולה', en: 'Maamar HaGeulah', fr: 'Maamar HaGuéoula' },
    lessonCount: 29,
    playlistId: 'PLI4WtgHMTlAew05nFHBHdJ0jDD6p_P5rB',
    firstLessonVideoId: 'DG3pWghqtes',
    bookUrlSlugs: ['מאמר-הגאולה', 'מאמר-הגאולה-צרפתית-עברית'],
  },
  {
    title: { he: 'קנאת ה׳ צבאות', en: 'Kin\'at Hashem Tzevaot', fr: 'Kinat Hachem Tsevaot' },
    lessonCount: 25,
    playlistId: 'PLI4WtgHMTlAd64raVoXQS5F4G9j0f3YR_',
    firstLessonVideoId: 'b9wEEc3YdBw',
    bookUrlSlugs: ['קנאת-ה-צבאות'],
  },
  {
    title: { he: 'כללים ראשונים', en: 'Kelalim Rishonim', fr: 'Kelalim Richonim' },
    lessonCount: 31,
    playlistId: 'PLI4WtgHMTlAdvOlD1zs6R3XD0v4UV5et3',
    firstLessonVideoId: 'UzmtOzhKdKA',
    bookUrlSlugs: [],
  },
]

// Order keys for an orderable collection are fractional-indexing keys: these
// are the first eleven in sequence, which is what Payload itself would assign.
const ORDER_KEYS = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'aA']

const PAGE_TEXT = {
  he: {
    title: 'שיעורים מלאים בספרי הרמח״ל',
    lead: 'הרב מרדכי שריקי מלמד את הספרים מתחילתם ועד סופם.',
    metaDescription: 'סדרות שיעורים מלאות בספרי הרמח״ל מפי הרב מרדכי שריקי, מן השיעור הראשון ועד סיום הספר.',
  },
  en: {
    title: 'Complete lessons on the Ramhal’s books',
    lead: 'Rabbi Mordechai Chriqui teaches each work from beginning to end.',
    metaDescription:
      'Complete lesson series on the Ramhal’s books taught by Rabbi Mordechai Chriqui, from the first lesson to the end of each work.',
  },
  fr: {
    title: 'Étude complète des livres du Ramhal',
    lead: 'Le Rav Mordekhaï Chriqui enseigne chaque ouvrage du début à la fin.',
    metaDescription:
      'Séries complètes de cours sur les livres du Ramhal par le Rav Mordekhaï Chriqui, du premier cours jusqu’à la fin de l’ouvrage.',
  },
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [index, course] of COURSES.entries()) {
    const inserted = await db.execute(sql`
      INSERT INTO "series" ("youtube_playlist_id", "first_lesson_youtube_id", "lesson_count", "_order", "display_title", "display_title_locale")
      VALUES (${course.playlistId}, ${course.firstLessonVideoId}, ${course.lessonCount}, ${ORDER_KEYS[index]}, ${course.title.he}, 'he')
      RETURNING "id"`)
    const seriesId = Number(inserted.rows[0].id)

    for (const locale of ['he', 'en', 'fr'] as const) {
      await db.execute(sql`
        INSERT INTO "series_locales" ("title", "_locale", "_parent_id")
        VALUES (${course.title[locale]}, ${locale}, ${seriesId})`)
    }

    for (const [position, urlSlug] of course.bookUrlSlugs.entries()) {
      await db.execute(sql`
        INSERT INTO "series_rels" ("parent_id", "path", "books_id", "order")
        SELECT ${seriesId}, 'relatedBooks', "id", ${position} FROM "books" WHERE "url_slug" = ${urlSlug}`)
    }
  }

  const page = await db.execute(sql`
    INSERT INTO "courses_page" ("updated_at", "created_at") VALUES (now(), now()) RETURNING "id"`)
  const pageId = Number(page.rows[0].id)
  for (const locale of ['he', 'en', 'fr'] as const) {
    await db.execute(sql`
      INSERT INTO "courses_page_locales" ("title", "lead", "meta_description", "_locale", "_parent_id")
      VALUES (${PAGE_TEXT[locale].title}, ${PAGE_TEXT[locale].lead}, ${PAGE_TEXT[locale].metaDescription}, ${locale}, ${pageId})`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const playlistIds = COURSES.map((course) => course.playlistId)
  await db.execute(sql`DELETE FROM "series" WHERE "youtube_playlist_id" IN (${sql.join(playlistIds.map((id) => sql`${id}`), sql`, `)})`)
  await db.execute(sql`DELETE FROM "courses_page"`)
}
