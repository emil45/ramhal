import type { Locale } from '@/lib/locale'

type LocalizedText = Record<Locale, string>

export type PressArticle = {
  id: string
  url: string
  outlet: string
  publishedAt: string
  title: string
  topic: LocalizedText
  summary: LocalizedText
}

// Original headlines remain in Hebrew because these links lead to Hebrew articles. The surrounding
// copy is localized so visitors never mistake a translated card for a translated source.
export const PRESS_ARTICLES_NEWEST_FIRST: readonly PressArticle[] = [
  {
    id: 'jerusalem-haredim-temple',
    url: 'https://jerusalemharedim.co.il/%D7%97%D7%A6%D7%A8%D7%95%D7%AA/%D7%9B%D7%99%D7%A6%D7%93-%D7%91%D7%95%D7%A0%D7%99%D7%9D-%D7%90%D7%AA-%D7%91%D7%99%D7%AA-%D7%94%D7%9E%D7%A7%D7%93%D7%A9-%D7%94%D7%A8%D7%91-%D7%9E%D7%A8%D7%93%D7%9B%D7%99-%D7%A9%D7%A8%D7%99%D7%A7%D7%99-%D7%91%D7%9E%D7%A1%D7%A8-%D7%A2%D7%95%D7%A6%D7%9E%D7%AA%D7%99-798048',
    outlet: 'ירושלים החרדית',
    publishedAt: '2026-07-24',
    title: 'כיצד בונים את בית המקדש? הרב מרדכי שריקי במסר עוצמתי',
    topic: { he: 'בית המקדש', en: 'The Temple', fr: 'Le Temple' },
    summary: {
      he: 'שיחת הרב מרדכי שריקי לאחר הקינות בבית רמח״ל, על דברי הרמח״ל, השיבה אל המקורות והדרך לבניין בית המקדש.',
      en: 'Rabbi Mordechai Chriqui speaks after the Tisha B’Av lamentations at Beit Ramhal about returning to the sources and rebuilding the Temple.',
      fr: 'Après les kinot à Beit Ramhal, le Rav Mordekhaï Chriqui relie l’enseignement du Ramhal, le retour aux sources et la reconstruction du Temple.',
    },
  },
  {
    id: 'jdn-tikkun-hayesod',
    url: 'https://www.jdn.co.il/gallery/2352102/',
    outlet: 'JDN',
    publishedAt: '2025-02-10',
    title: 'בבית הכנסת "בית רמח״ל" בירושלים ערכו ״תיקון היסוד״ בתענית',
    topic: { he: 'גלריה', en: 'Photo essay', fr: 'Reportage photo' },
    summary: {
      he: 'תיעוד מיום תפילה ותענית בימי השובבי״ם בבית רמח״ל, בהובלת הרב שריקי ובדגש על תפילה, תיקון ולימוד פנימיות התורה.',
      en: 'A photo essay from a day of prayer and fasting at Beit Ramhal, led by Rabbi Chriqui during the weeks of Shovavim.',
      fr: 'Un reportage photo sur une journée de prière et de jeûne à Beit Ramhal, conduite par le Rav Chriqui pendant les semaines de Chovavim.',
    },
  },
  {
    id: 'makor-rishon-kedushat-zion',
    url: 'https://www.makorrishon.co.il/judaism/article/287667',
    outlet: 'מקור ראשון',
    publishedAt: '2023-04-29',
    title: 'הארגון החרדי שמנסה להחדיר למגזר ציונות והקמת מאחזים ביו״ש',
    topic: { he: 'דיוקן', en: 'Profile', fr: 'Portrait' },
    summary: {
      he: 'כתבה רחבה על אגודת קדושת ציון, ובה דיוקן קצר של הרב שריקי כמקובל, ראש כולל וראש מכון רמח״ל.',
      en: 'A wide-ranging feature on Kedushat Zion that includes a short profile of Rabbi Chriqui and his work at Machon Ramhal.',
      fr: 'Une enquête sur Kedushat Zion qui comprend un portrait du Rav Chriqui et de son œuvre à la tête de l’Institut Ramhal.',
    },
  },
  {
    id: 'inn-revealing-the-secret',
    url: 'https://www.inn.co.il/news/408814',
    outlet: 'ערוץ 7',
    publishedAt: '2019-08-01',
    title: 'מגלים את הסוד',
    topic: { he: 'קבלה', en: 'Kabbalah', fr: 'Kabbale' },
    summary: {
      he: 'על התחזקות לימוד הקבלה בציבור הדתי־לאומי, עם דברי הרב שריקי על המשיכה הגוברת לכתבי הרמח״ל, לזוהר ולפנימיות התורה.',
      en: 'A feature on the renewed study of Kabbalah in religious-Zionist communities, including Rabbi Chriqui on the growing interest in Ramhal and the Zohar.',
      fr: 'Une enquête sur le renouveau de l’étude de la Kabbale dans le monde sioniste religieux, avec le Rav Chriqui sur l’intérêt croissant pour le Ramhal et le Zohar.',
    },
  },
  {
    id: 'kikar-ramhal-hillula',
    url: 'https://www.kikar.co.il/prayers/37264',
    outlet: 'כיכר השבת',
    publishedAt: '2011-05-30',
    title: 'היום: הילולת הרמח״ל — רבי משה חיים לוצאטו זצוק״ל',
    topic: { he: 'הילולת הרמח״ל', en: 'Ramhal’s hillula', fr: 'Hiloula du Ramhal' },
    summary: {
      he: 'כתבה מקיפה ליום פטירת הרמח״ל על דמותו, כתביו ופועלו של הרב שריקי בהוצאת הספרים ובהפצת תורתו.',
      en: 'An extensive piece for the anniversary of Ramhal’s passing, covering his life, writings, and Rabbi Chriqui’s publishing work.',
      fr: 'Un article publié pour l’anniversaire de la disparition du Ramhal, consacré à sa vie, ses écrits et l’œuvre éditoriale du Rav Chriqui.',
    },
  },
]
