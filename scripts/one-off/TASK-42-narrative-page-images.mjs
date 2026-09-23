#!/usr/bin/env node
// One-time migration for TASK-42: moves /ramhal, /rabbi-chriqui and
// /beit-ramhal from hardcoded page components into the Pages collection,
// and their photos from public/ and assets/ into Media. Content below is
// copied verbatim from the three route files being replaced (see the task
// report for the before/after screenshot comparison) — this script is the
// permanent record of that copy, not a reusable importer.
//
// Run through vite-node directly (there is no npm script for a one-off),
// same as scripts/import-books.mjs and for the same reason:
// payload.config.ts pulls in payload-oauth2, whose module graph plain
// `node` cannot load.
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'

import { parseDatabaseIdentity } from '../../src/lib/diagnostics.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

const EXPECTED_DATABASES = {
  '2c951382a7f8': 'production',
}

function fail(message) {
  throw new Error(`TASK-42 refused to proceed: ${message}`)
}

const connectionString = process.env.DATABASE_URI
if (!connectionString) fail('DATABASE_URI is not set')

const identity = parseDatabaseIdentity(connectionString)
const environment = EXPECTED_DATABASES[identity.fingerprint]
if (!environment) fail(`unrecognised database fingerprint ${identity.fingerprint}`)
console.log(`Target database: ${environment} (fingerprint ${identity.fingerprint})`)

const assetsDir = new URL('../../assets/', import.meta.url)
const publicDir = new URL('../../public/', import.meta.url)

// ---------------------------------------------------------------------------
// Lexical richText helpers — every body block here is plain paragraphs with
// occasional bold/italic runs, so this is all convertLexicalToJSX needs.
// ---------------------------------------------------------------------------
function run(text) {
  return { type: 'text', version: 1, text, format: 0, style: '', mode: 'normal', detail: 0 }
}
function bold(text) {
  return { ...run(text), format: 1 }
}
function italic(text) {
  return { ...run(text), format: 2 }
}
function paragraphNode(children, direction) {
  return { type: 'paragraph', version: 1, children, direction, format: '', indent: 0, textFormat: 0, textStyle: '' }
}
function richText(paragraphs, direction) {
  return {
    root: {
      type: 'root',
      version: 1,
      children: paragraphs.map((children) => paragraphNode(children, direction)),
      direction,
      format: '',
      indent: 0,
    },
  }
}
function plain(text, direction) {
  return richText([[run(text)]], direction)
}

// ---------------------------------------------------------------------------
// Images — every photo the three pages use, with the best available source
// (assets/ originals matched by eye against the public/ webp they produced;
// see the task report) and real alt text per locale.
// ---------------------------------------------------------------------------
const IMAGES = {
  heroStudyHall: {
    file: new URL('beit-ramhal/IMG_1685.jpeg', assetsDir),
    alt: {
      he: 'הרב מרדכי שריקי מוסר שיעור בבית המדרש המלא בלומדים',
      en: 'Rabbi Mordechai Chriqui teaching in a study hall filled with students',
      fr: 'Le Rav Mordekhaï Chriqui donne un cours dans une salle d’étude remplie d’élèves',
    },
  },
  sanctuary: {
    file: new URL('beit-ramhal/4450282.jpeg', assetsDir),
    alt: {
      he: 'חלל בית הכנסת של בית רמח״ל, ובמרכזו ארון הקודש',
      en: 'The sanctuary of Beit Ramhal with its ark at the centre',
      fr: 'La synagogue de Beit Ramhal, avec l’arche sainte au centre',
    },
  },
  exterior: {
    file: new URL('beit-ramhal/3603261.jpeg', assetsDir),
    alt: {
      he: 'המבנה החיצוני של בית רמח״ל בהר נוף, ירושלים',
      en: 'The exterior of Beit Ramhal in Har Nof, Jerusalem',
      fr: 'L’extérieur de Beit Ramhal à Har Nof, Jérusalem',
    },
  },
  ark: {
    file: new URL('beit-ramhal/4450281.jpeg', assetsDir),
    alt: {
      he: 'ארון הקודש המפואר בבית הכנסת רמח״ל',
      en: 'The ornate Torah ark in the Ramhal synagogue',
      fr: 'L’arche sainte ouvragée de la synagogue Ramhal',
    },
  },
  galleryPaduaArk: {
    file: new URL('beit-ramhal/3585491.jpeg', assetsDir),
    alt: {
      he: 'פרט מתיעוד בית הכנסת בפדובה',
      en: 'A detail from the record of the Padua synagogue',
      fr: 'Un détail du témoignage sur la synagogue de Padoue',
    },
  },
  galleryPaduaDetails: {
    file: new URL('beit-ramhal/3585493.jpeg', assetsDir),
    alt: {
      he: 'הקשתות והעיטורים הפדובאיים',
      en: 'The arches and ornament of the Padua original',
      fr: 'Les arcs et les ornements du modèle de Padoue',
    },
  },
  gallerySanctuaryArk: {
    file: new URL('beit-ramhal/4450278.jpeg', assetsDir),
    alt: {
      he: 'מבט אל ארון הקודש',
      en: 'A view towards the Torah ark',
      fr: 'Vue vers l’arche sainte',
    },
  },
  gallerySanctuaryGallery: {
    file: new URL('beit-ramhal/4450280.jpeg', assetsDir),
    alt: {
      he: 'עבודת העץ לאורך עזרת התפילה',
      en: 'Woodwork along the prayer hall',
      fr: 'Le travail du bois dans la salle de prière',
    },
  },
  galleryBimah: {
    file: new URL('beit-ramhal/4450283.jpeg', assetsDir),
    alt: {
      he: 'הבימה והחלון הירושלמי',
      en: 'The bimah and its Jerusalem window',
      fr: 'La bimah et sa fenêtre sur Jérusalem',
    },
  },
  galleryTeachingClose: {
    file: new URL('beit-ramhal/IMG_1688.jpeg', assetsDir),
    alt: {
      he: 'שיעור בבית המדרש',
      en: 'A class in the beit midrash',
      fr: 'Un cours au beit hamidrach',
    },
  },
  portrait: {
    file: new URL('rabbi-chriqui/portrait.webp', publicDir),
    alt: {
      he: 'הרב מרדכי שריקי מלמד לפני ארון הקודש בבית רמח״ל',
      en: 'Rabbi Mordechai Chriqui teaching before the Torah ark at Beit Ramhal',
      fr: 'Le Rav Mordekhaï Chriqui enseigne devant l’arche sainte de Beit Ramhal',
    },
  },
  hanukkahLighting: {
    file: new URL('rabbi-chriqui/hanukkah-lighting.webp', publicDir),
    alt: {
      he: 'הרב מרדכי שריקי מדליק נרות חנוכה בבית רמח״ל',
      en: 'Rabbi Mordechai Chriqui lighting Hanukkah candles at Beit Ramhal',
      fr: 'Le Rav Mordekhaï Chriqui allume les lumières de Hanoucca à Beit Ramhal',
    },
  },
  donatePhoto: {
    file: new URL('donate/rabbi-chriqui-speaking.jpg', assetsDir),
    alt: {
      he: 'הרב מרדכי שריקי מוסר שיעור בבית רמח״ל',
      en: 'Rabbi Mordechai Chriqui delivering a lesson at Beit Ramhal',
      fr: 'Le Rav Mordekhaï Chriqui donne un cours à Beit Ramhal',
    },
  },
}

async function uploadImages(payload) {
  const media = {}
  for (const [key, image] of Object.entries(IMAGES)) {
    const doc = await payload.create({
      collection: 'media',
      locale: 'he',
      data: { alt: image.alt.he },
      filePath: fileURLToPath(image.file),
    })
    await payload.update({ collection: 'media', id: doc.id, locale: 'en', data: { alt: image.alt.en } })
    await payload.update({ collection: 'media', id: doc.id, locale: 'fr', data: { alt: image.alt.fr } })
    media[key] = doc.id
  }
  return media
}

// ---------------------------------------------------------------------------
// /rabbi-chriqui
// ---------------------------------------------------------------------------
function rabbiChriquiContent(locale, media) {
  const dir = locale === 'he' ? 'rtl' : 'ltr'
  const bySlug = {
    he: {
      title: 'הרב מרדכי שריקי',
      eyebrow: 'מייסד מכון רמח״ל',
      lead: 'עורך, מתרגם ומורה שהקדיש את חייו להשבת כתבי הרמח״ל אל מרכז עולם התורה.',
      metaDescription: 'הרב מרדכי שריקי, מייסד מכון רמח״ל והסמכות המובילה בדורנו לכתבי הרמח״ל — חייו, מפעלו ושיחה מצולמת בקולו.',
      biographyTitle: 'מפעל חיים',
      paragraphs: [
        'הרב מרדכי שריקי (גם: שריקי, צריקי, Chriqui) נולד ב-16 באוגוסט 1959 בקזבלנקה, מרוקו. התחנך במרוקו, בצרפת ובקנדה, בעל תואר שני במדעי הדתות מאוניברסיטת קונקורדיה ומחקר דוקטורט בסורבון על הקבלה כמטאפיזיקה. מתגורר בהר נוף, ירושלים.',
        'נחשב לסמכות המובילה בדורנו בכתבי הרמח״ל. הקדיש את חייו להוצאה לאור, לעריכה, לתרגום וללימוד כתבי הרמח״ל. פירושו נושא את השם כתר מרדכי, המבחין את מהדורותיו משל אחרים.',
        'פועל בשלושה תפקידים: עורך כתבי יד ומהדורות ביקורתיות, מתרגם כתבי הרמח״ל לצרפתית, ומחבר מחקרים מקוריים משלו. הוא זה שהקים את מכון רמח״ל בשנת תשמ״ו (1986) — השנה, תשפ״ו (2026), מציינת ארבעים שנה לפעילות המכון.',
      ],
      secondImageCaption: 'הדלקת נרות חנוכה בבית רמח״ל',
      videoEyebrow: 'שיחה מצולמת · כאן מורשת',
      videoTitle: 'על הדור של הרמח״ל — בקולו של הרב',
      videoDescription: 'בשיחה אישית מספר הרב שריקי על הדחף שהוביל אותו אל כתבי הרמח״ל ועל המפעל שלא חדל לבנות מאז.',
      videoPlayerTitle: 'שמישהו יעצור אותי — הרב מרדכי שריקי על הדור של הרמח״ל',
    },
    en: {
      title: 'Rabbi Mordechai Chriqui',
      eyebrow: 'Founder of Machon Ramhal',
      lead: 'An editor, translator and teacher who has devoted his life to returning the Ramhal’s writings to the centre of Jewish learning.',
      metaDescription: 'Rabbi Mordechai Chriqui, founder of Machon Ramhal and a leading contemporary authority on the Ramhal — his life, work and a filmed conversation.',
      biographyTitle: 'A life’s work',
      paragraphs: [
        'Rabbi Mordechai Chriqui (also transliterated Shriki, Tsriki) was born on 16 August 1959 in Casablanca, Morocco. Educated in Morocco, France and Canada, he holds an MA in Religious Sciences from Concordia University, with doctoral research at the Sorbonne on kabbalah as metaphysics. He is based in Har Nof, Jerusalem.',
        'He is widely regarded as the leading contemporary authority on the Ramhal, having devoted his life to publishing, editing, translating and teaching his writings. His own commentary carries the name Keter Mordechai, distinguishing his editions from other publishers’.',
        'He works in three capacities: editor of manuscripts and critical editions, translator of the Ramhal into French, and author of original studies. He founded Machon Ramhal in 1986 — this year, 2026, marks the institute’s fortieth anniversary.',
      ],
      secondImageCaption: 'Lighting Hanukkah candles at Beit Ramhal',
      videoEyebrow: 'Filmed conversation · Kan Moreshet',
      videoTitle: 'The Ramhal’s generation — in the Rabbi’s own voice',
      videoDescription: 'In a personal conversation, Rabbi Chriqui describes what drew him to the Ramhal’s writings and the undertaking he has continued to build ever since.',
      videoPlayerTitle: 'Let someone stop me — Rabbi Mordechai Chriqui on the Ramhal’s generation',
    },
    fr: {
      title: 'Rav Mordekhaï Chriqui',
      eyebrow: 'Fondateur de l’Institut Ramhal',
      lead: 'Éditeur, traducteur et enseignant, il a consacré sa vie à rendre aux écrits du Ramhal leur place au cœur de l’étude juive.',
      metaDescription: 'Le Rav Mordekhaï Chriqui, fondateur de l’Institut Ramhal et grande autorité contemporaine sur le Ramhal — sa vie, son œuvre et un entretien filmé.',
      biographyTitle: 'L’œuvre d’une vie',
      paragraphs: [
        'Le Rav Mordekhaï Chriqui est né le 16 août 1959 à Casablanca, au Maroc. Formé au Maroc, en France et au Canada, il est titulaire d’une maîtrise en sciences religieuses de l’université Concordia et a mené des recherches doctorales à la Sorbonne sur la kabbale comme métaphysique. Il réside à Har Nof, à Jérusalem.',
        'Il est largement reconnu comme la principale autorité contemporaine sur le Ramhal, ayant consacré sa vie à la publication, à l’édition, à la traduction et à l’enseignement de ses écrits. Son propre commentaire porte le nom de Keter Mordekhaï, distinguant ses éditions de celles des autres éditeurs.',
        'Il agit à trois titres : éditeur de manuscrits et d’éditions critiques, traducteur du Ramhal en français, et auteur d’études originales. Il a fondé l’Institut Ramhal en 1986 — cette année, 2026, marque le quarantième anniversaire de l’institut.',
      ],
      secondImageCaption: 'Allumage des lumières de Hanoucca à Beit Ramhal',
      videoEyebrow: 'Entretien filmé · Kan Moreshet',
      videoTitle: 'La génération du Ramhal — par la voix du Rav',
      videoDescription: 'Dans un entretien personnel, le Rav Chriqui raconte ce qui l’a conduit vers les écrits du Ramhal et l’œuvre qu’il n’a cessé de bâtir depuis.',
      videoPlayerTitle: 'Que quelqu’un m’arrête — le Rav Mordekhaï Chriqui et la génération du Ramhal',
    },
  }[locale]

  return {
    title: bySlug.title,
    eyebrow: bySlug.eyebrow,
    lead: bySlug.lead,
    metaDescription: bySlug.metaDescription,
    heroImage: media.portrait,
    content: [
      { blockType: 'sectionHeading', style: 'standard', heading: bySlug.biographyTitle },
      { blockType: 'richText', body: richText(bySlug.paragraphs.map((text) => [run(text)]), dir) },
      { blockType: 'imageFigure', image: media.hanukkahLighting, caption: bySlug.secondImageCaption },
      { blockType: 'sectionHeading', style: 'video', kicker: bySlug.videoEyebrow, heading: bySlug.videoTitle },
      { blockType: 'richText', body: plain(bySlug.videoDescription, dir) },
      { blockType: 'video', videoId: 'heJLjGQZhsY', title: bySlug.videoPlayerTitle },
    ],
  }
}

// ---------------------------------------------------------------------------
// /beit-ramhal
// ---------------------------------------------------------------------------
function beitRamhalContent(locale, media) {
  const dir = locale === 'he' ? 'rtl' : 'ltr'
  const bySlug = {
    he: {
      title: 'בית רמח״ל',
      eyebrow: 'הר נוף · ירושלים',
      lead: 'בית של תורה, תפילה ויצירה — המקום שבו מפעלו של מכון רמח״ל מקבל חיים מדי יום.',
      location: 'רח׳ הרב רפאל קצנלבוגן 73, ירושלים',
      metaDescription: 'בית המדרש ובית הכנסת של מכון רמח״ל בהר נוף, ירושלים, שנבנה בהשראת בית הכנסת של הרמח״ל בפדובה.',
      statistics: [
        { value: '4', label: 'קומות' },
        { value: 'כ־1,200 מ״ר', label: 'שטח המבנה' },
        { value: 'כ־15', label: 'אברכי כולל' },
        { value: '50+', label: 'משתתפים בשיעורים' },
      ],
      midrashTitle: 'בית מדרש רמח״ל',
      midrashParagraphs: [
        'בית מדרש רמח״ל הוא חלק מבית כנסת רמח״ל בשכונת הר נוף בירושלים. הכולל והשיעורים ממשיכים את שליחותו של המכון: לימוד שיטתי ומעמיק של תורת הרמח״ל לצד סדרי לימוד בהלכה ובקבלה.',
        'בכולל לומדים כחמישה עשר אברכים, ויותר מחמישים איש משתתפים בשיעורים בהלכה, בקבלה ובכתבי הרמח״ל.',
      ],
      studiesLabel: 'בין סדרי הלימוד',
      studies: ['הלכה', 'עץ חיים', 'קל״ח פתחי חכמה', 'דעת תבונות', 'מסילת ישרים'],
      synagogueTitle: 'פדובה בירושלים',
      synagogueParagraphs: [
        'בית הכנסת נבנה כדוגמת בית הכנסת בפדובה שבו התפלל הרמח״ל, ואשר נחרב בשואה. זהו בית הכנסת היחיד בעולם שנבנה בדמותו. הוא משמר בירושלים זיכרון אדריכלי ורוחני של עולמו של הרמח״ל — לא כמוזיאון, אלא כבית תפילה חי.',
        'המבנה משתרע על פני כ־1,200 מ״ר וארבע קומות. תחת קורת גג אחת נמצאים אולם, חדרי לימוד, משרדים, בית מדרש, מקווה ובית הכנסת הגדול.',
      ],
      buildingTitle: 'בית אחד, שלושה מעגלים',
      buildingDetails: [
        { icon: 'landmark', title: 'קהילה', body: 'בית כנסת פעיל לתפילה ולחיי קהילה.' },
        { icon: 'bookOpen', title: 'לימוד', body: 'כולל, בית מדרש וחדרי שיעורים ללימוד מתמשך.' },
        { icon: 'building2', title: 'המכון', body: 'משרדי מכון רמח״ל ומרכז מפעל ההוצאה לאור.' },
      ],
      galleryTitle: 'מראות מבית רמח״ל',
      galleryDescription: 'המפגש בין זיכרון פדובה, אומנות בית הכנסת וחיי בית המדרש.',
      galleryCaptions: {
        galleryPaduaArk: 'פרט מתיעוד בית הכנסת בפדובה',
        galleryPaduaDetails: 'הקשתות והעיטורים הפדובאיים',
        gallerySanctuaryArk: 'מבט אל ארון הקודש',
        gallerySanctuaryGallery: 'עבודת העץ לאורך עזרת התפילה',
        galleryBimah: 'הבימה והחלון הירושלמי',
        galleryTeachingClose: 'שיעור בבית המדרש',
      },
      closingTitle: 'מסורת שנכנסים לתוכה',
      closingBody: 'האדריכלות מחברת בין פדובה לירושלים; הלימוד והתפילה הם שהופכים את המבנה לבית.',
    },
    en: {
      title: 'Beit Ramhal',
      eyebrow: 'Har Nof · Jerusalem',
      lead: 'A home of Torah, prayer and creation — where the work of Machon Ramhal is lived every day.',
      location: '73 Rabbi Rafael Katzenelbogen Street, Jerusalem',
      metaDescription: 'The beit midrash and synagogue of Machon Ramhal in Har Nof, Jerusalem, inspired by the Ramhal’s synagogue in Padua.',
      statistics: [
        { value: '4', label: 'floors' },
        { value: 'c. 1,200 m²', label: 'building area' },
        { value: 'c. 15', label: 'kollel scholars' },
        { value: '50+', label: 'class participants' },
      ],
      midrashTitle: 'Beit Midrash Ramhal',
      midrashParagraphs: [
        'Beit Midrash Ramhal is part of the Ramhal synagogue in Jerusalem’s Har Nof neighbourhood. Its kollel and classes continue the institute’s mission: sustained, systematic study of the Ramhal alongside halakha and kabbalah.',
        'Around fifteen full-time scholars learn in the kollel, and more than fifty people take part in classes on halakha, kabbalah and the writings of the Ramhal.',
      ],
      studiesLabel: 'Among the subjects studied',
      studies: ['Halakha', 'Etz Chaim', 'Kalach Pitchei Chochma', 'Daat Tevunot', 'Mesillat Yesharim'],
      synagogueTitle: 'Padua in Jerusalem',
      synagogueParagraphs: [
        'The synagogue was built after the synagogue in Padua where the Ramhal prayed, which was destroyed in the Holocaust. It is the only synagogue in the world built to that model. In Jerusalem it preserves an architectural and spiritual memory of his world — not as a museum, but as a living house of prayer.',
        'The four-storey building covers approximately 1,200 square metres. It brings together a hall, classrooms, offices, a beit midrash, a mikveh and the main synagogue.',
      ],
      buildingTitle: 'One home, three circles',
      buildingDetails: [
        { icon: 'landmark', title: 'Community', body: 'An active synagogue for prayer and communal life.' },
        { icon: 'bookOpen', title: 'Study', body: 'A kollel, beit midrash and classrooms for sustained learning.' },
        { icon: 'building2', title: 'Institute', body: 'The offices of Machon Ramhal and the centre of its publishing work.' },
      ],
      galleryTitle: 'Inside Beit Ramhal',
      galleryDescription: 'Where the memory of Padua, the craftsmanship of the synagogue and the life of the beit midrash meet.',
      galleryCaptions: {
        galleryPaduaArk: 'A detail from the record of the Padua synagogue',
        galleryPaduaDetails: 'The arches and ornament of the Padua original',
        gallerySanctuaryArk: 'A view towards the Torah ark',
        gallerySanctuaryGallery: 'Woodwork along the prayer hall',
        galleryBimah: 'The bimah and its Jerusalem window',
        galleryTeachingClose: 'A class in the beit midrash',
      },
      closingTitle: 'A tradition you can enter',
      closingBody: 'The architecture connects Padua and Jerusalem; study and prayer are what turn the building into a home.',
    },
    fr: {
      title: 'Beit Ramhal',
      eyebrow: 'Har Nof · Jérusalem',
      lead: 'Une maison d’étude, de prière et de création — le lieu où l’œuvre de l’Institut Ramhal prend vie chaque jour.',
      location: '73, rue du Rav Rafael Katzenelbogen, Jérusalem',
      metaDescription: 'Le beit hamidrach et la synagogue de l’Institut Ramhal à Har Nof, Jérusalem, inspirés de la synagogue du Ramhal à Padoue.',
      statistics: [
        { value: '4', label: 'étages' },
        { value: 'env. 1 200 m²', label: 'de superficie' },
        { value: 'env. 15', label: 'avrekhim au kollel' },
        { value: '50+', label: 'participants aux cours' },
      ],
      midrashTitle: 'Beit Hamidrach Ramhal',
      midrashParagraphs: [
        'Le Beit Hamidrach Ramhal fait partie de la synagogue Ramhal, dans le quartier de Har Nof à Jérusalem. Son kollel et ses cours prolongent la mission de l’institut : une étude suivie et méthodique de l’œuvre du Ramhal, aux côtés de la halakha et de la kabbale.',
        'Une quinzaine d’avrekhim étudient au kollel et plus de cinquante personnes participent aux cours de halakha, de kabbale et consacrés aux écrits du Ramhal.',
      ],
      studiesLabel: 'Parmi les matières étudiées',
      studies: ['Halakha', 'Etz Haïm', 'Kala’h Pit’hé Hokhma', 'Daat Tevounot', 'Messilat Yécharim'],
      synagogueTitle: 'Padoue à Jérusalem',
      synagogueParagraphs: [
        'La synagogue a été bâtie sur le modèle de celle de Padoue où priait le Ramhal, détruite pendant la Shoah. Elle est la seule synagogue au monde construite selon ce modèle. Elle en préserve à Jérusalem la mémoire architecturale et spirituelle — non comme un musée, mais comme une maison de prière vivante.',
        'Le bâtiment s’étend sur environ 1 200 m² et quatre étages. Il réunit une salle, des salles d’étude, des bureaux, un beit hamidrach, un mikvé et la grande synagogue.',
      ],
      buildingTitle: 'Une maison, trois cercles',
      buildingDetails: [
        { icon: 'landmark', title: 'Communauté', body: 'Une synagogue active pour la prière et la vie communautaire.' },
        { icon: 'bookOpen', title: 'Étude', body: 'Un kollel, un beit hamidrach et des salles pour une étude suivie.' },
        { icon: 'building2', title: 'Institut', body: 'Les bureaux de l’Institut Ramhal et le centre de son travail éditorial.' },
      ],
      galleryTitle: 'À l’intérieur de Beit Ramhal',
      galleryDescription: 'Là où se rencontrent la mémoire de Padoue, le travail d’art de la synagogue et la vie du beit hamidrach.',
      galleryCaptions: {
        galleryPaduaArk: 'Un détail du témoignage sur la synagogue de Padoue',
        galleryPaduaDetails: 'Les arcs et les ornements du modèle de Padoue',
        gallerySanctuaryArk: 'Vue vers l’arche sainte',
        gallerySanctuaryGallery: 'Le travail du bois dans la salle de prière',
        galleryBimah: 'La bimah et sa fenêtre sur Jérusalem',
        galleryTeachingClose: 'Un cours au beit hamidrach',
      },
      closingTitle: 'Une tradition dans laquelle entrer',
      closingBody: 'L’architecture relie Padoue à Jérusalem ; l’étude et la prière font du bâtiment une maison.',
    },
  }[locale]

  const galleryOrder = ['galleryPaduaArk', 'galleryPaduaDetails', 'gallerySanctuaryArk', 'gallerySanctuaryGallery', 'galleryBimah', 'galleryTeachingClose']

  return {
    title: bySlug.title,
    eyebrow: bySlug.eyebrow,
    lead: bySlug.lead,
    metaDescription: bySlug.metaDescription,
    location: bySlug.location,
    heroImage: media.heroStudyHall,
    content: [
      { blockType: 'sectionHeading', style: 'standard', heading: bySlug.midrashTitle },
      { blockType: 'richText', body: richText(bySlug.midrashParagraphs.map((text) => [run(text)]), dir) },
      { blockType: 'statGrid', items: bySlug.statistics },
      { blockType: 'tagList', title: bySlug.studiesLabel, tags: bySlug.studies.map((label) => ({ label })) },

      { blockType: 'sectionHeading', style: 'standard', heading: bySlug.synagogueTitle },
      { blockType: 'imageFigure', image: media.sanctuary, caption: '' },
      { blockType: 'richText', body: richText(bySlug.synagogueParagraphs.map((text) => [run(text)]), dir) },

      { blockType: 'sectionHeading', style: 'standard', heading: bySlug.buildingTitle },
      { blockType: 'featureCards', items: bySlug.buildingDetails },

      { blockType: 'sectionHeading', style: 'standard', heading: bySlug.galleryTitle },
      { blockType: 'richText', body: plain(bySlug.galleryDescription, dir) },
      {
        blockType: 'gallery',
        items: galleryOrder.map((key) => ({ image: media[key], caption: bySlug.galleryCaptions[key] })),
      },

      { blockType: 'sectionHeading', style: 'standard', heading: bySlug.closingTitle },
      { blockType: 'richText', body: plain(bySlug.closingBody, dir) },
      { blockType: 'imageFigure', image: media.exterior, caption: '' },
      { blockType: 'imageFigure', image: media.ark, caption: '' },
    ],
  }
}

// ---------------------------------------------------------------------------
// /ramhal
// ---------------------------------------------------------------------------
function ramhalContentHe() {
  const dir = 'rtl'
  return {
    title: 'הרמח״ל — רבי משה חיים לוצאטו',
    eyebrow: 'תס״ז–תק״ז · 1707–1746',
    lead: 'מקובל, פילוסוף, איש מוסר ומחזאי — מן המוחות השיטתיים והמשפיעים ביותר במחשבת ישראל. תורתו מעניקה שפה בהירה לשאלות הגדולות של אמונה, הנהגה ותכלית הבריאה.',
    metaDescription: 'חייו של רבי משה חיים לוצאטו ומבוא בהיר לתורתו: אמונה, הנהגה וגילוי היחוד.',
    content: [
      {
        blockType: 'quote',
        variant: 'hero',
        quote: '״כל חכמת האמת אינה אלא חכמה מראה אמיתת האמונה, להבין כל מה שנברא או שנעשה בעולם, איך יוצא מן הרצון העליון, ואיך מתנהג הכל בדרך נכון מן האל האחד ברוך הוא, לגלגל הכל, להביאו אל השלמות הגמור באחרונה.״',
        source: 'קל״ח פתחי חכמה, פתח א׳',
      },
      { blockType: 'sectionHeading', style: 'article', heading: 'חייו בקצרה' },
      {
        blockType: 'richText',
        body: richText(
          [
            [run('רבי משה חיים לוצאטו, המוכר בראשי התיבות רמח״ל, נולד בגטו היהודי של פדובה שבאיטליה. מקובל, פילוסוף, איש מוסר ומחזאי, הוא נחשב לאחד המוחות השיטתיים ביותר במחשבת ישראל.')],
            [run('בגיל כעשרים דיווח על גילוי מגיד — קול פנימי — שעורר התנגדות עזה מצד הרבנות בת זמנו. חלק גדול מכתביו נאסר, הוסתר או אבד בימי חייו. הוא עלה לארץ ישראל בשנת 1743 ונפטר בעכו שלוש שנים לאחר מכן, בגיל 39 בלבד.')],
            [
              run('כתביו — '),
              bold('מסילת ישרים'),
              run(', '),
              bold('דעת תבונות'),
              run(', '),
              bold('דרך ה׳'),
              run(', '),
              bold('קל״ח פתחי חכמה'),
              run(', '),
              bold('אדיר במרום'),
              run(', '),
              bold('מאמר הגאולה'),
              run(' ועוד — הם מיסודות עולם התורה עד ימינו. הכרתו כגאון באה ברובה לאחר מותו, ועבודת מכון רמח״ל בהוצאת כתביו נתפסת כתיקון אותו עוול.'),
            ],
          ],
          dir,
        ),
      },
      { blockType: 'sectionHeading', style: 'article', kicker: 'מפת מחשבה', heading: 'תורת הרמח״ל' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run(
                'תורת הרמח״ל יסודה בקבלה בכלל ובקבלת האר״י בפרט. אצל רבים מן המקובלים מתארת הקבלה את הספירות, הפרצופים והעולמות — את השתלשלות הבריאה ואת תיקונה. הרמח״ל מעניק למושגים האלה מבנה מחשבתי בהיר: חכמת הקבלה היא ידיעת הנהגת הבורא, חוקיה ומסיבותיה, והדרך שבה הכול מתקדם אל תכלית אחת.',
              ),
            ],
            [
              run('בהגדרתו הקולעת בפתח הראשון של '),
              bold('קל״ח פתחי חכמה'),
              run(' ניכרים שלושה יסודות. הם אינם נושאים נפרדים, אלא מהלך אחד: מן האמונה, דרך ההנהגה, אל התכלית.'),
            ],
          ],
          dir,
        ),
      },
      {
        blockType: 'labeledList',
        layout: 'grid',
        items: [
          { marker: 'א', label: 'אמונה', body: 'הכרת מציאות ה׳ ויחוד שליטתו על כל הרצונות.' },
          { marker: 'ב', label: 'הנהגה', body: 'הבנת הדרך המדויקת שבה המציאות מתנהלת.' },
          { marker: 'ג', label: 'התכלית', body: 'גילוי יחודו יתברך והבאת הבריאה לשלמותה.' },
        ],
      },
      { blockType: 'sectionHeading', style: 'article', ornament: 'א', heading: 'אמונה — לא רק לדעת, אלא להבין' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run('האמונה היא נושא מרכזי שהרמח״ל הקדיש לו חיבורים שלמים, ובהם '),
              bold('דרך ה׳'),
              run(' ו'),
              bold('דעת תבונות'),
              run(', לצד מאמרים קצרים ופרקים בתוך ספריו הגדולים. אצלו אין האמונה מסתכמת בידיעה שיש מצוי אחד, מוכרח המציאות, שממנו נמצאים כל הנמצאים. היא מבקשת להבין גם את '),
              bold('יחוד השליטה'),
              run(': ה׳ הוא הרצון היחיד השולט בכל הרצונות.'),
            ],
          ],
          dir,
        ),
      },
      {
        blockType: 'quote',
        variant: 'boxed',
        quote:
          '״ואולם נתחייבנו אנחנו בני ישראל להעיד על אמיתת יחודו יתברך בכל הבחינות... בין בבחינת המציאות... בין בבחינת השליטה... בין בבחינת ההנהגה... שאין המסבב אלא אחד ואין התכלית אלא אחת... ואע״פ שאין דבר זה גלוי עתה באמת, הנה אמיתת הדבר כך היא, וכן יגלה ויודע בסוף הכל.״',
        source: 'דרך ה׳, חלק ד׳, פרק ד׳, סימן י״א',
      },
      {
        blockType: 'richText',
        body: plain(
          'גילוי היחוד יושלם רק בסוף, אך גם עכשיו פועל הרצון האחד בכל המעשים — בדרך של הסתר. דווקא ההסתר הזה יוצר את מקומה של האמונה: להכיר שגם כאשר המהלך אינו גלוי לעינינו, המציאות אינה נטולת כיוון ואינה מופקרת למקרה.',
          dir,
        ),
      },
      { blockType: 'sectionHeading', style: 'article', ornament: 'ב', heading: 'הנהגה — לפענח את לשון הקבלה' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run(
                'הרמח״ל פתח דרך חדשה להבנת לשון הקבלה. במקום להשאיר את מושגי הספירות, האורות, הפרצופים והעולמות חתומים בשפת הסוד, הוא תרגם אותם לשפה שכלית של הנהגה. כל ספירה וכל פרצוף מבטאים מדרגה אלוקית הפועלת במציאות ובהיסטוריה האנושית.',
              ),
            ],
            [
              run(
                'אין פירוש הדבר שהאורות והספירות הם משל בלבד. הם מצביעים על מציאות רוחנית דקה, שאין השכל האנושי יכול לתפוס ישירות, אלא באמצעות לבוש וצורה. בדומה לכך, הנביא אינו משיג את הכבוד העליון כשלעצמו; הוא משיג צורה רוחנית, ובכוח תכונותיו וסגולותיו מפענח אותה ומצייר את משמעותה בשכלו.',
              ),
            ],
            [
              run(
                'בכך הסיר הרמח״ל את סכנת ההגשמה ממאמרי הזוהר והאר״י, ובו בזמן גילה בהם מפת הנהגה: כיצד מתנהל העולם הזה, כיצד הוא קשור לעולם הבא, ואיך ריבוי האירועים והרצונות מתכנס אל פעולתו של אל אחד, יחיד ומיוחד.',
              ),
            ],
          ],
          dir,
        ),
      },
      { blockType: 'sectionHeading', style: 'article', ornament: 'ג', heading: 'גילוי יחודו — תכלית אחת, שתי נקודות מבט' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run(
                '״תכלית הבריאה היא להיטיב לנבראיו״ — מן היסודות החוזרים בכתבי הרמח״ל. במקומות אחרים הוא מנסח תכלית עמוקה יותר: גילוי יחודו. שתי התכליות אינן סותרות; הן מתארות אותו מהלך משתי נקודות מבט.',
              ),
            ],
            [
              run('מנקודת מבטו של האדם, התכלית היא ההטבה — העונג והדבקות בה׳ שעליהם מדבר '),
              bold('מסילת ישרים'),
              run('. מנקודת המבט שבה האלוקים במרכז, התכלית היא גילוי היחוד: ההכרה שאין כוח עצמאי כנגד רצונו, ושכל פרטי ההנהגה מצטרפים לבסוף אל השלמות האמיתית.'),
            ],
          ],
          dir,
        ),
      },
      {
        blockType: 'quote',
        variant: 'ruled',
        quote:
          '״שהוא לבדו משגיח על כל בריותיו השגחה פרטית, ואין שום דבר נולד בעולמו אלא מרצונו ומידו, ולא במקרה, ולא בטבע, ולא במזל... וכל סדרי המשפט וכל החוקים אשר חקק — כולם תלויים ברצונו.״',
        source: 'דעת תבונות, סימן ל״ו',
      },
      {
        blockType: 'richText',
        body: plain(
          'מכאן שגם מה שנראה כרע או כרצון נגדי עתיד להתברר כחלק מן המהלך שהביא את הכול אל השלמות. האמת הזאת אינה גלויה במלואה בתוך ההיסטוריה; לפי הרמח״ל, היא תיפרש לעיני כל רק ביום הדין הגדול, כאשר יתגלה היושר שבכל מעשה ומעשה.',
          dir,
        ),
      },
      {
        blockType: 'quote',
        variant: 'inline',
        quote: '״והנה ביום הדין הגדול יפרוש האדון ברוך הוא את השמלה לעיני כל היצור... ויראה יושר משפטו בכל מעשה ומעשה, קטון וגדול...״',
        source: 'דעת תבונות, סימן ק״ע',
      },
      { blockType: 'sectionHeading', style: 'concluding', kicker: 'מסקנה', heading: 'אדריכל האדם השלם ומפרש ההנהגה' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run('ב'),
              bold('מסילת ישרים'),
              run(' נעשה הרמח״ל לאדריכל של האדם השלם; ב'),
              bold('דעת תבונות'),
              run(' וב'),
              bold('דרך ה׳'),
              run(' הוא מדריך אל אמונה ודאית; וב'),
              bold('קל״ח פתחי חכמה'),
              run(', '),
              bold('אדיר במרום'),
              run(' וחיבוריו האחרים הוא פותח שער להבנת ההנהגה האלוקית. זהו החוט המקשר בין כתביו: להפוך את הסוד למבנה שאפשר ללמוד, להבין ולחיות לאורו.'),
            ],
          ],
          dir,
        ),
      },
    ],
  }
}

function ramhalContentEn() {
  const dir = 'ltr'
  return {
    title: 'The Ramhal — Rabbi Moshe Chaim Luzzatto',
    eyebrow: '1707–1746 · Padua to Acre',
    lead: 'Kabbalist, philosopher, ethicist, grammarian, poet and playwright — Rabbi Moshe Chaim Luzzatto was one of the most original and systematic minds in Jewish thought.',
    metaDescription: 'The life, writings and lasting influence of Rabbi Moshe Chaim Luzzatto.',
    content: [
      {
        blockType: 'quote',
        variant: 'hero',
        quote: '“I do not want to create conflicts with anybody. It is peace that we need.”',
        source: 'Ramhal, in a letter to his teacher Rabbi Isaiah Bassan',
      },
      { blockType: 'sectionHeading', style: 'article', heading: 'A remarkable beginning' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run(
                'Ramhal — also written Ramchal, the initials of Rabbi Moshe Chaim Luzzatto — was born in 1707 in the Jewish ghetto of Padua, Italy. His parents, Jacob Vita and Diamente Luzzatto, placed him in the yeshiva of Padua, where his gifts became apparent at an unusually early age.',
              ),
            ],
            [
              run('The institute’s biography records that, according to his friend and student Rabbi Yekutiel Gordon, by fourteen he knew the Kabbalah of the Ari by heart, without even his parents knowing the extent of his study. It places his first Kabbalistic work at fifteen. At seventeen he composed '),
              italic('Leshon Limmudim'),
              run(', a study of Hebrew grammar, style, rhetoric and verse.'),
            ],
            [run('His command of Hebrew extended well beyond religious exposition. His poetry and dramatic writing later led literary historians to regard him as an important precursor of modern Hebrew literature.')],
          ],
          dir,
        ),
      },
      { blockType: 'sectionHeading', style: 'article', heading: 'The Maggid and the circle of study' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run('At about twenty, Ramhal reported hearing a '),
              italic('Maggid'),
              run(', an inner revelatory voice. He described the experience in a 1729 letter: while meditating on a '),
              italic('yihud'),
              run(', he awoke to a voice that said it had come to reveal hidden wisdom. He subsequently wrote many pages of mystical teaching under what he understood to be the Maggid’s direction.'),
            ],
            [
              run('A small circle formed around him for sustained study of the Zohar and for '),
              italic('Tikkun HaShechinah'),
              run(' — the spiritual repair associated with the Divine Presence. Its members accepted demanding rules of discipline, purity and devotion.'),
            ],
          ],
          dir,
        ),
      },
      { blockType: 'sectionHeading', style: 'article', heading: 'Nine years of controversy' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run(
                'News of the Maggid and the study circle triggered fierce opposition. The trauma left by the false messiah Sabbatai Zevi was still close; for some leading rabbis, a young mystic writing about redemption appeared not merely unconventional but dangerous. Rabbi Moshe Hagiz became one of Ramhal’s most determined opponents.',
              ),
            ],
            [
              run(
                'Ramhal denied claiming to be the Messiah, a saviour or a wonder-worker. His letters repeatedly asked that the dispute be examined on its substance and brought to a peaceful end. Nevertheless, under pressure he signed a declaration agreeing to stop writing revelations in the language of the Zohar. Earlier manuscripts were sealed and placed in safekeeping; much of that material was later lost.',
              ),
            ],
            [
              run(
                'Between 1730 and 1734 he continued to write extensively, but in a more restrained and rational form. In 1735, exhausted by the conflict, he left Italy with his young family. During a stop in Frankfurt he was compelled to accept a further restriction on writing and teaching Kabbalah. One poignant condition allowed him to resume study at forty; he would die before reaching that age.',
              ),
            ],
          ],
          dir,
        ),
      },
      { blockType: 'sectionHeading', style: 'article', heading: 'Amsterdam and the masterworks' },
      {
        blockType: 'richText',
        body: plain(
          'Amsterdam gave Ramhal a measure of stability. Rather than present Kabbalah in its most overt symbolic language, he wrote works of ethics and faith with extraordinary order and clarity. The result included three books that remain central to Jewish learning.',
          dir,
        ),
      },
      {
        blockType: 'labeledList',
        layout: 'stacked',
        items: [
          { label: 'Mesillat Yesharim', body: 'The Path of the Just — a disciplined path of ethical and spiritual growth, still studied across the Jewish world.' },
          { label: 'Daat Tevunot', body: 'A dialogue on faith, divine governance and the ultimate revelation of God’s unity.' },
          { label: 'Derech Hashem', body: 'The Way of God — a systematic account of creation, providence, prophecy and religious life.' },
        ],
      },
      { blockType: 'sectionHeading', style: 'article', heading: 'The Land of Israel' },
      {
        blockType: 'richText',
        body: richText(
          [
            [run('In 1743 Ramhal fulfilled his long-held wish to settle in the Land of Israel. The surviving record of these final years is sparse. He lived in or near Acre, and tradition also connects him with Tiberias.')],
            [run('His life there was tragically short. In 1746, during an epidemic, Ramhal died at only thirty-nine, together with members of his family. No work securely known to have been written during these final years has yet been identified.')],
          ],
          dir,
        ),
      },
      { blockType: 'sectionHeading', style: 'article', kicker: 'Recognition after his death', heading: 'A lasting legacy' },
      {
        blockType: 'richText',
        body: plain(
          'Like many innovators, Ramhal received the recognition denied him in life only after his death. Traditions associated with the Vilna Gaon and the Maggid of Mezeritch speak of him with exceptional admiration. More enduring than any single tribute is the place his books now hold: works once viewed with suspicion have become foundations of ethics, faith and Kabbalistic thought.',
          dir,
        ),
      },
      {
        blockType: 'quote',
        variant: 'ruled',
        quote: '“This book bears witness to the greatness of its author and his extraordinary vision of human heights.”',
        source: 'A traditional attribution to the Vilna Gaon, concerning Mesillat Yesharim',
      },
      {
        blockType: 'quote',
        variant: 'highlight',
        quote:
          'Ramhal’s achievement was to unite worlds often kept apart: rigorous logic and mystical vision, ethical practice and metaphysics, Hebrew literary art and systematic theology. His short life produced a body of work that continues to teach readers how inner growth, history and divine purpose belong to one coherent picture.',
      },
    ],
  }
}

function ramhalContentFr() {
  const dir = 'ltr'
  return {
    title: 'Ramhal — la lumière éclatante',
    eyebrow: '1707–1746 · De Padoue à Acre',
    lead: 'Cabaliste et logicien, talmudiste et poète, moraliste, grammairien, théologien et dramaturge — le Ramhal réunit des facultés que l’on oppose trop souvent.',
    metaDescription: 'La vie, les œuvres et la pensée de Rabbi Moché Haïm Luzzatto.',
    content: [
      {
        blockType: 'quote',
        variant: 'hero',
        quote: '« Avec le Ramhal, le caché devient révélé. La réalité cachée devient signifiante. »',
        source: 'Présentation de l’œuvre du Ramhal par l’Institut',
      },
      { blockType: 'sectionHeading', style: 'article', heading: 'Une vie brève, une œuvre immense' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run(
                'Ramhal est l’acronyme de Rabbi Moché Haïm Luzzatto, né en 1707 dans le ghetto juif de Padoue, en Italie. Très jeune, il se distingue par l’étendue de son savoir et par une rare capacité à unir l’étude talmudique, la poésie, la langue hébraïque, la logique et la Cabale.',
              ),
            ],
            [
              run(
                'À vingt ans, il rapporte la révélation d’un '),
              italic('Maguid'),
              run(', une voix intérieure qui lui transmet des enseignements mystiques. Autour de lui se forme un cercle voué à l’étude continue du Zohar et au '),
              italic('Tikkun HaShechinah'),
              run('. Cette activité, autant que le langage messianique de certains écrits, provoque une opposition violente.'),
            ],
            [
              run(
                'Contraint de quitter l’Italie, il gagne Amsterdam en 1735. Il y trouve quelques années de sérénité et publie ses œuvres les plus connues. En 1743, il part pour la Terre d’Israël et s’établit à Acre. Il meurt pendant une épidémie en 1746, à seulement trente-neuf ans.',
              ),
            ],
          ],
          dir,
        ),
      },
      { blockType: 'sectionHeading', style: 'article', heading: 'Écrire sous la pression de la controverse' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run(
                'Les polémiques qui entourent Ramhal doivent être comprises dans le traumatisme laissé par Sabbataï Tsevi. Pour plusieurs autorités rabbiniques, la combinaison d’un jeune maître, de révélations privées et d’un discours sur la rédemption évoque le danger encore récent du faux messianisme.',
              ),
            ],
            [
              run('En 1730, sur le conseil de son maître Rabbi Isaïe Bassan, Ramhal signe un engagement qui lui interdit d’écrire ses révélations dans la forme araméenne du Zohar. Cela ne suffit pas à calmer ses adversaires. Lors de son passage à Francfort en 1735, la menace du '),
              italic('hérèm'),
              run(' le conduit à accepter une nouvelle limitation portant sur l’écriture, l’enseignement et même l’étude de la Cabale.'),
            ],
            [
              run(
                'Cette contrainte transforme aussi son expression. Sans renoncer à la profondeur de la Cabale, Ramhal adopte une langue plus rationnelle, ordonnée et accessible. La persécution n’éteint donc pas sa pensée : elle contribue, paradoxalement, à lui donner la forme qui marquera durablement le judaïsme.',
              ),
            ],
          ],
          dir,
        ),
      },
      { blockType: 'sectionHeading', style: 'article', kicker: 'Amsterdam, 1735–1743', heading: 'Les œuvres majeures' },
      {
        blockType: 'richText',
        body: plain('À Amsterdam, Ramhal compose des livres qui traitent directement de l’éthique et de la foi, tout en portant la structure profonde de sa pensée cabalistique.', dir),
      },
      {
        blockType: 'labeledList',
        layout: 'stacked',
        items: [
          { label: 'Messilat Yécharim', body: 'La Voie des justes expose une progression exigeante vers la perfection morale, la piété et la proximité de Dieu.' },
          { label: 'Derekh Hachem', body: 'La Voie de Dieu ordonne les fondements de la foi juive en un ensemble clair et systématique.' },
          { label: 'Daat Tévounot', body: 'Un dialogue consacré à la Providence, au sens de l’histoire et à la révélation finale de l’Unité.' },
        ],
      },
      { blockType: 'sectionHeading', style: 'article', ornament: 'א', heading: 'La Hanhaga — penser la direction de l’histoire' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run('Le projet intellectuel du Ramhal n’est pas de saisir l’Essence divine, inaccessible à l’entendement, mais de comprendre la Volonté telle qu’elle se manifeste dans la création et dans l’histoire. L’histoire n’est donc pas une suite d’événements sans lien : elle est le champ de la '),
              italic('Hanhaga'),
              run(', la direction divine du monde.'),
            ],
            [
              run('Dans cette lecture, les '),
              italic('Partsoufim'),
              run(' — les « visages » ou configurations de la Cabale — ne décrivent pas seulement les principes de la création. Ils expriment aussi les modes selon lesquels l’histoire est conduite. Le langage symbolique devient ainsi une carte de sens.'),
            ],
            [run('Ramhal donne au lecteur des clefs pour passer de l’allégorie à une pensée métaphysique intelligible. Le caché n’est ni banalisé ni supprimé : il devient signifiant. C’est l’une des raisons pour lesquelles son œuvre parle aussi bien au lecteur en quête de rigueur qu’à celui qui cherche la profondeur spirituelle.')],
          ],
          dir,
        ),
      },
      { blockType: 'sectionHeading', style: 'article', ornament: 'ב', heading: 'De la dualité à la révélation de l’Unité' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run('L’Institut résume la visée de l’œuvre par deux termes : '),
              italic('Hanhaga'),
              run(', la direction divine, et '),
              italic('Guilouy Yihoudo'),
              run(', la révélation de l’Unité. Les oppositions qui structurent notre perception — sacré et profane, âme et corps, particulier et universel, mystique et rationnel — ne constituent pas le dernier mot du réel.'),
            ],
            [
              run('Dans '),
              italic('Daat Tévounot'),
              run(', la connaissance humaine ordinaire est décrite comme une pensée par contrastes : nous comprenons la lumière par les ténèbres, la vie par la mort, le bien par le mal. Ramhal cherche au-delà de cette perception fragmentée une voie de l’Unité, dans laquelle les contraires trouvent leur place dans un dessein unique.'),
            ],
          ],
          dir,
        ),
      },
      {
        blockType: 'quote',
        variant: 'ruled',
        label: 'En une phrase',
        quote: 'Dieu ne désigne pas seulement le Créateur qui donne l’existence, mais la Volonté unique qui conduit toute l’histoire.',
      },
      {
        blockType: 'richText',
        body: plain(
          'Le gouvernement de l’Unité n’efface pourtant ni l’homme ni sa responsabilité. Il lui donne une place dans le Tikkoun hakelali, la réparation universelle. La liberté humaine est réelle mais située : elle trouve son accomplissement dans la connaissance de Dieu, l’action juste et la participation consciente au projet divin.',
          dir,
        ),
      },
      { blockType: 'sectionHeading', style: 'article', kicker: 'Une pensée toujours actuelle', heading: 'Un héritage vivant' },
      {
        blockType: 'richText',
        body: richText(
          [
            [
              run('La force singulière du Ramhal tient à l’unité de son œuvre. Le moraliste de '),
              italic('Messilat Yécharim'),
              run(', le théologien de '),
              italic('Derekh Hachem'),
              run(', le penseur de l’histoire de '),
              italic('Daat Tévounot'),
              run(' et le cabaliste des grands commentaires ne sont pas quatre auteurs différents.'),
            ],
            [run('Tous cherchent à montrer comment l’existence humaine, le devenir du monde et la vie intérieure s’inscrivent dans une seule direction. Chez Ramhal, la logique ne réduit pas le mystère : elle en rend l’étude possible.')],
          ],
          dir,
        ),
      },
      {
        blockType: 'quote',
        variant: 'highlight',
        quote:
          'Son œuvre libère la pensée des oppositions faciles et invite à découvrir, derrière la multiplicité du monde, la cohérence d’une Volonté unique. C’est cette alliance de clarté et de profondeur qui conserve aujourd’hui toute son actualité.',
      },
    ],
  }
}

const RAMHAL_CONTENT = { he: ramhalContentHe, en: ramhalContentEn, fr: ramhalContentFr }

async function createPage(payload, slug, byLocale) {
  const he = byLocale.he
  const doc = await payload.create({
    collection: 'pages',
    locale: 'he',
    data: { slug, title: he.title, eyebrow: he.eyebrow, lead: he.lead, metaDescription: he.metaDescription, location: he.location, heroImage: he.heroImage, content: he.content },
  })
  for (const locale of ['en', 'fr']) {
    const localized = byLocale[locale]
    await payload.update({
      collection: 'pages',
      id: doc.id,
      locale,
      data: { title: localized.title, eyebrow: localized.eyebrow, lead: localized.lead, metaDescription: localized.metaDescription, location: localized.location, content: localized.content },
    })
  }
  return doc.id
}

const { default: config } = await import('../../src/payload.config.ts')
const payload = await getPayload({ config })

try {
  const existing = await payload.find({ collection: 'pages', where: { slug: { in: ['ramhal', 'rabbi-chriqui', 'beit-ramhal'] } }, limit: 3 })
  if (existing.docs.length > 0) {
    fail(`pages already exist: ${existing.docs.map((doc) => doc.slug).join(', ')}`)
  }
  const siteSettings = await payload.findGlobal({ slug: 'siteSettings' })
  if (siteSettings.donatePhoto) fail('siteSettings.donatePhoto is already set')

  const media = await uploadImages(payload)

  const rabbiChriquiId = await createPage(payload, 'rabbi-chriqui', {
    he: rabbiChriquiContent('he', media),
    en: rabbiChriquiContent('en', media),
    fr: rabbiChriquiContent('fr', media),
  })
  const beitRamhalId = await createPage(payload, 'beit-ramhal', {
    he: beitRamhalContent('he', media),
    en: beitRamhalContent('en', media),
    fr: beitRamhalContent('fr', media),
  })
  const ramhalId = await createPage(payload, 'ramhal', {
    he: RAMHAL_CONTENT.he(),
    en: RAMHAL_CONTENT.en(),
    fr: RAMHAL_CONTENT.fr(),
  })

  await payload.updateGlobal({ slug: 'siteSettings', data: { donatePhoto: media.donatePhoto } })

  console.log(JSON.stringify({ environment, mediaCreated: Object.keys(media).length, pages: { rabbiChriquiId, beitRamhalId, ramhalId } }, null, 2))
} finally {
  await payload.destroy()
}

// Payload's Postgres adapter retains a reconnect client.
process.exit(0)
