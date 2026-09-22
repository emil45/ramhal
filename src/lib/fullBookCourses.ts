import type { Locale } from '@/lib/locale'

type LocalizedTitle = Record<Locale, string>

export type FullBookCourse = {
  id: string
  title: LocalizedTitle
  language: 'he'
  lessonCount: number
  playlistId: string
  firstLessonYoutubeId: string
  bookSlugByLocale: Partial<Record<Locale, string>>
}

// Curated from the institute's public YouTube playlists on 22 September
// 2026. This lists book-length walkthroughs rather than shorter thematic
// playlists.
export const FULL_BOOK_COURSES: readonly FullBookCourse[] = [
  {
    id: 'daat-tevunot',
    title: { he: 'דעת תבונות', en: 'Daat Tevunot', fr: 'Daat Tevounot' },
    language: 'he',
    lessonCount: 52,
    playlistId: 'PLI4WtgHMTlAfkJTDMLytz2F8ZjesjKrHj',
    firstLessonYoutubeId: '6Qe6-HIMYwg',
    bookSlugByLocale: { he: 'דעת-תבונות', en: 'דעת-תבונות', fr: 'דעת-תבונות-צרפתית-עברית' },
  },
  {
    id: 'derech-hashem',
    title: { he: 'דרך ה׳', en: 'Derech Hashem', fr: 'Derekh Hachem' },
    language: 'he',
    lessonCount: 114,
    playlistId: 'PLI4WtgHMTlAcMcyA61GyLY50OcIWCWyKt',
    firstLessonYoutubeId: 'P0d06W8B_ME',
    bookSlugByLocale: { he: 'דרך-ה-עם-פירוש-דרך-היחוד', en: 'דרך-ה-עם-פירוש-דרך-היחוד', fr: 'דרך-השם-צרפתית-עברית' },
  },
  {
    id: 'kalach-pitchei-chochma',
    title: { he: 'קל״ח פתחי חכמה', en: 'Kalach Pitchei Chochma', fr: 'Kala’h Pit’hé Hokhma' },
    language: 'he',
    lessonCount: 135,
    playlistId: 'PLI4WtgHMTlAc0TX_0fy57GeHHatGFz_8t',
    firstLessonYoutubeId: 'JZRG0z6YL5A',
    bookSlugByLocale: { he: 'קלח-פתחי-חכמה', en: 'קלח-פתחי-חכמה', fr: 'קלח-פתחי-חכמה-צרפתית-עברית' },
  },
  {
    id: 'pinot-hamerkava',
    title: { he: 'פינות המרכבה', en: 'Pinot HaMerkava', fr: 'Pinot HaMerkava' },
    language: 'he',
    lessonCount: 27,
    playlistId: 'PLI4WtgHMTlAccFS82ct85NsknLQ4WKmnv',
    firstLessonYoutubeId: 'Ld1F0C0tBYE',
    bookSlugByLocale: { he: 'פינות-המרכבה', en: 'פינות-המרכבה', fr: 'פינות-המרכבה' },
  },
  {
    id: 'mishkenei-elyon',
    title: { he: 'משכני עליון', en: 'Mishkenei Elyon', fr: 'Michkené Elyon' },
    language: 'he',
    lessonCount: 2,
    playlistId: 'PLI4WtgHMTlAf9UBHF6iC7piUZM64ovwv4',
    firstLessonYoutubeId: 'nvp9cdefYdY',
    bookSlugByLocale: { he: 'משכני-עליון', en: 'משכני-עליון', fr: 'משכני-עליון' },
  },
  {
    id: 'adir-bamarom',
    title: { he: 'אדיר במרום', en: 'Adir BaMarom', fr: 'Adir BaMarom' },
    language: 'he',
    lessonCount: 208,
    playlistId: 'PLI4WtgHMTlAfFGjt4FyO7CokQoy6t6B8v',
    firstLessonYoutubeId: '4PY4qSHWN3I',
    bookSlugByLocale: { he: 'אדיר-במרום-הוצאת-מכון-רמחל', en: 'אדיר-במרום-הוצאת-מכון-רמחל', fr: 'אדיר-במרום-הוצאת-מכון-רמחל' },
  },
  {
    id: 'tikunim-hadashim',
    title: { he: 'תיקונים חדשים', en: 'Tikunim Hadashim', fr: 'Tikounim Hadachim' },
    language: 'he',
    lessonCount: 114,
    playlistId: 'PLI4WtgHMTlAe-YrTemz4s9vpafXi3FFv2',
    firstLessonYoutubeId: 'K154opViCGE',
    bookSlugByLocale: { he: 'תיקונים-חדשים', en: 'תיקונים-חדשים', fr: 'תיקונים-חדשים-ארמית-צרפתית' },
  },
  {
    id: 'razin-genizin',
    title: { he: 'רזין גניזין', en: 'Razin Genizin', fr: 'Razin Guenizin' },
    language: 'he',
    lessonCount: 58,
    playlistId: 'PLI4WtgHMTlAcH4U3VsIyd-tJp61ZvXjn8',
    firstLessonYoutubeId: 'NNYSdzoZV8A',
    bookSlugByLocale: { he: 'רזין-גניזין-תשעו-2016', en: 'רזין-גניזין-תשעו-2016', fr: 'רזין-גניזין-תשעו-2016' },
  },
  {
    id: 'maamar-hageulah',
    title: { he: 'מאמר הגאולה', en: 'Maamar HaGeulah', fr: 'Maamar HaGuéoula' },
    language: 'he',
    lessonCount: 29,
    playlistId: 'PLI4WtgHMTlAew05nFHBHdJ0jDD6p_P5rB',
    firstLessonYoutubeId: 'DG3pWghqtes',
    bookSlugByLocale: { he: 'מאמר-הגאולה', en: 'מאמר-הגאולה', fr: 'מאמר-הגאולה-צרפתית-עברית' },
  },
  {
    id: 'kinat-hashem-tzevaot',
    title: { he: 'קנאת ה׳ צבאות', en: "Kin'at Hashem Tzevaot", fr: 'Kinat Hachem Tsevaot' },
    language: 'he',
    lessonCount: 25,
    playlistId: 'PLI4WtgHMTlAd64raVoXQS5F4G9j0f3YR_',
    firstLessonYoutubeId: 'b9wEEc3YdBw',
    bookSlugByLocale: { he: 'קנאת-ה-צבאות', en: 'קנאת-ה-צבאות', fr: 'קנאת-ה-צבאות' },
  },
  {
    id: 'kelalim-rishonim',
    title: { he: 'כללים ראשונים', en: 'Kelalim Rishonim', fr: 'Kelalim Richonim' },
    language: 'he',
    lessonCount: 31,
    playlistId: 'PLI4WtgHMTlAdvOlD1zs6R3XD0v4UV5et3',
    firstLessonYoutubeId: 'UzmtOzhKdKA',
    bookSlugByLocale: {},
  },
]

export const FULL_BOOK_COURSE_LESSON_COUNT = FULL_BOOK_COURSES.reduce((total, course) => total + course.lessonCount, 0)

export function firstLessonUrl(course: FullBookCourse): string {
  return `https://www.youtube.com/watch?v=${course.firstLessonYoutubeId}&list=${course.playlistId}`
}

export function playlistUrl(course: FullBookCourse): string {
  return `https://www.youtube.com/playlist?list=${course.playlistId}`
}

export function firstLessonThumbnailUrl(course: FullBookCourse): string {
  return `https://i.ytimg.com/vi/${course.firstLessonYoutubeId}/hqdefault.jpg`
}

export function fullBookCourseForBook(bookSlug: string): FullBookCourse | null {
  return FULL_BOOK_COURSES.find((course) => Object.values(course.bookSlugByLocale).includes(bookSlug)) ?? null
}

export function preferredBookSlug(course: FullBookCourse, locale: Locale): string | null {
  return course.bookSlugByLocale[locale] ?? course.bookSlugByLocale.he ?? null
}
