import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { SectionHeading } from '@/components/storefront/SectionHeading'
import { QuestionEmailActions } from '@/components/storefront/QuestionEmailActions'
import { isLocale } from '@/lib/locale'
import { getContactDetails } from '@/lib/siteSettingsData'

const CONTENT = {
  he: {
    metadataTitle: 'שו״ת עם הרב מרדכי שריקי | מכון רמח״ל',
    metadataDescription: 'שאלות ותשובות עם הרב מרדכי שריקי בענייני רמח״ל, אמונה, קבלה ועבודת ה׳. שליחת שאלות למכון רמח״ל בדוא״ל.',
    eyebrow: 'שאלות ותשובות עם הרב מרדכי שריקי',
    title: 'שו״ת',
    lead: 'מקום לשאלות בענייני כתבי הרמח״ל, אמונה, קבלה ועבודת ה׳ — ולתשובות שאפשר ללמוד מהן גם לאחרים.',
    emailPrompt: 'אפשר לשלוח שאלה לרב דרך מכון רמח״ל:',
    emailAction: 'שליחת שאלה למכון',
    emailSubject: 'שאלה למדור שו״ת',
    copyEmail: 'העתקה',
    emailCopied: 'הועתק',
    copyEmailFailed: 'לא הועתק',
    emailUnavailable: 'כתובת הדוא״ל של המכון תופיע כאן לאחר שתוגדר.',
    archiveTitle: 'ארכיון השו״ת',
    questionNumber: 'שו״ת א׳',
    topicLabel: 'נושא',
    dateLabel: 'תאריך',
    answerLabel: 'תשובה',
    question: {
      date: '2026-09-23',
      dateDisplay: '23 בספטמבר 2026',
      topic: 'לימוד כתבי הרמח״ל',
      title: 'מהי הדרך הנכונה להתחיל ללמוד את כתבי הרמח״ל?',
      body: 'ישנם ספרים רבים ושיעורים רבים. האם נכון להתחיל במסילת ישרים, בדרך ה׳ או דווקא מספר אחר — ואיך בונים סדר לימוד שאפשר להתמיד בו?',
      answer: [
        'אין סדר אחד המתאים לכל אדם. מי שמבקש להתחיל מעבודת האדם וממידותיו עשוי למצוא שער נוח במסילת ישרים; מי שמבקש תמונה שיטתית של יסודות האמונה והנהגת הבורא יוכל לפתוח בדרך ה׳.',
        'העיקר הוא לבחור חיבור אחד, ללמוד אותו כסדרו ולא למהר. כדאי לקבוע זמן קבוע, לסכם כל פרק במילים פשוטות ולחזור אל המהלך השלם לפני שעוברים לספר נוסף.',
        'שיעור מלווה יכול לסייע במושגים ובמבנה, אך אינו מחליף את המפגש הישיר עם לשונו המדויקת של הרמח״ל.',
      ],
    },
  },
  en: {
    metadataTitle: 'Questions & Answers with Rabbi Mordechai Chriqui | Machon Ramhal',
    metadataDescription: 'Questions and answers with Rabbi Mordechai Chriqui on the Ramhal, Jewish thought, kabbalah and spiritual practice. Send a question to Machon Ramhal by email.',
    eyebrow: 'Questions and answers with Rabbi Mordechai Chriqui',
    title: 'Questions & Answers',
    lead: 'A place for questions about the Ramhal’s writings, Jewish thought, kabbalah and spiritual practice — with answers that can remain useful to other learners.',
    emailPrompt: 'Send a question to the Rabbi through Machon Ramhal:',
    emailAction: 'Email a question',
    emailSubject: 'Question for the Q&A section',
    copyEmail: 'Copy',
    emailCopied: 'Copied',
    copyEmailFailed: 'Copy failed',
    emailUnavailable: 'The institute’s email address will appear here once configured.',
    archiveTitle: 'The Q&A archive',
    questionNumber: 'Responsum 1',
    topicLabel: 'Subject',
    dateLabel: 'Date',
    answerLabel: 'Answer',
    question: {
      date: '2026-09-23',
      dateDisplay: 'September 23, 2026',
      topic: 'Studying the Ramhal’s writings',
      title: 'What is the right way to begin studying the Ramhal’s writings?',
      body: 'There are many books and many recorded lessons. Should one begin with Mesillat Yesharim, Derech Hashem or another work — and how can a lasting course of study be built?',
      answer: [
        'There is no single order that suits every reader. Someone beginning with character and spiritual practice may find Mesillat Yesharim the most approachable gateway; someone seeking a systematic account of faith and divine governance may begin with Derech Hashem.',
        'The important thing is to choose one work, study it in sequence and resist rushing. Set a regular time, restate each chapter in plain language and return to the whole argument before moving to another book.',
        'A supporting lesson can help with concepts and structure, but it does not replace a direct encounter with the Ramhal’s precise language.',
      ],
    },
  },
  fr: {
    metadataTitle: 'Questions–réponses avec le Rav Mordekhaï Chriqui | Institut Ramhal',
    metadataDescription: 'Questions et réponses avec le Rav Mordekhaï Chriqui sur le Ramhal, la pensée juive, la kabbale et le service divin. Envoyez votre question par e-mail.',
    eyebrow: 'Questions–réponses avec le Rav Mordekhaï Chriqui',
    title: 'Questions–réponses',
    lead: 'Un espace consacré aux questions sur les écrits du Ramhal, la pensée juive, la kabbale et le service divin — avec des réponses utiles à d’autres étudiants.',
    emailPrompt: 'Envoyez votre question au Rav par l’intermédiaire de l’Institut Ramhal :',
    emailAction: 'Envoyer une question',
    emailSubject: 'Question pour la rubrique Questions–réponses',
    copyEmail: 'Copier',
    emailCopied: 'Copiée',
    copyEmailFailed: 'Échec de la copie',
    emailUnavailable: 'L’adresse e-mail de l’institut apparaîtra ici une fois configurée.',
    archiveTitle: 'Les questions–réponses',
    questionNumber: 'Réponse 1',
    topicLabel: 'Sujet',
    dateLabel: 'Date',
    answerLabel: 'Réponse',
    question: {
      date: '2026-09-23',
      dateDisplay: '23 septembre 2026',
      topic: 'Étudier les écrits du Ramhal',
      title: 'Par où commencer l’étude des écrits du Ramhal ?',
      body: 'Il existe de nombreux livres et de nombreux cours. Faut-il commencer par Messilat Yécharim, Derekh Hachem ou un autre ouvrage — et comment construire une étude durable ?',
      answer: [
        'Il n’existe pas un ordre unique qui convienne à chacun. Celui qui veut commencer par le travail de l’homme et de ses qualités trouvera dans Messilat Yécharim une porte d’entrée accessible ; celui qui cherche un exposé méthodique de la foi et de la conduite divine pourra commencer par Derekh Hachem.',
        'L’essentiel est de choisir un ouvrage, de l’étudier dans l’ordre et sans hâte. Il est utile de fixer un temps régulier, de résumer chaque chapitre avec des mots simples et de revenir à l’ensemble du raisonnement avant de passer à un autre livre.',
        'Un cours d’accompagnement peut éclairer les notions et la structure, mais il ne remplace pas la rencontre directe avec la langue précise du Ramhal.',
      ],
    },
  },
} as const

export async function generateMetadata({ params }: PageProps<'/[locale]/questions-and-answers'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const content = CONTENT[locale]
  return { title: content.metadataTitle, description: content.metadataDescription }
}

export default async function QuestionsAndAnswersPage({ params }: PageProps<'/[locale]/questions-and-answers'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const content = CONTENT[locale]
  const question = content.question
  const contact = await getContactDetails(locale)

  return (
    <article>
      <section className="border-b border-border bg-paper-deep">
        <div className="page-container grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16 lg:py-16">
          <div className="flex max-w-3xl flex-col items-start">
            <p className="mb-4 text-sm font-semibold text-gold-ink">{content.eyebrow}</p>
            <h1 className="type-display">{content.title}</h1>
            <div aria-hidden className="my-6 flex w-24 flex-col gap-[3px]">
              <span className="h-[3px] bg-gold" />
              <span className="h-px bg-gold" />
            </div>
            <p className="max-w-2xl text-xl leading-relaxed sm:text-2xl">{content.lead}</p>
          </div>

          <aside className="border-t border-gold pt-7 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
            {contact.email ? (
              <QuestionEmailActions
                copiedLabel={content.emailCopied}
                copyFailedLabel={content.copyEmailFailed}
                copyLabel={content.copyEmail}
                email={contact.email}
                emailAction={content.emailAction}
                emailPrompt={content.emailPrompt}
                emailSubject={content.emailSubject}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{content.emailUnavailable}</p>
            )}
          </aside>
        </div>
      </section>

      <section className="page-container py-14 lg:py-16">
        <div className="max-w-4xl">
          <SectionHeading>{content.archiveTitle}</SectionHeading>
        </div>

        <article id="question-1" className="scroll-mt-8 border-t border-gold pt-8">
          <div className="grid gap-8 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-12">
            <header className="flex flex-col items-start gap-3">
              <p className="font-serif text-lg text-gold-ink">{content.questionNumber}</p>
              <dl className="mt-2 text-sm leading-relaxed">
                <dt className="text-muted-foreground">{content.topicLabel}</dt>
                <dd className="font-medium text-teal-deep">{question.topic}</dd>
                <dt className="mt-4 text-muted-foreground">{content.dateLabel}</dt>
                <dd>
                  <time dateTime={question.date}>{question.dateDisplay}</time>
                </dd>
              </dl>
            </header>

            <div className="max-w-3xl">
              <h2 className="type-heading">{question.title}</h2>
              <p className="mt-5 border-s-[3px] border-teal ps-5 text-lg leading-[1.8]">{question.body}</p>

              <div className="mt-10 border-t border-border pt-8">
                <p className="mb-4 text-sm font-semibold text-teal">{content.answerLabel}</p>
                <div className="type-prose flex flex-col gap-5 text-lg">
                  {question.answer.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
    </article>
  )
}
