import { Mail, Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SectionHeading } from '@/components/storefront/SectionHeading'
import { Button, buttonVariants } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { isLocale } from '@/lib/locale'
import { matchesQuestionSearch } from '@/lib/questionSearch'
import { questionsPath } from '@/lib/routes'
import { getContactDetails } from '@/lib/siteSettingsData'
import { cn } from '@/lib/utils'

const CONTENT = {
  he: {
    metadataTitle: 'שו״ת עם הרב מרדכי שריקי | מכון רמח״ל',
    metadataDescription: 'שאלות ותשובות עם הרב מרדכי שריקי בענייני רמח״ל, אמונה, קבלה ועבודת ה׳. שליחת שאלות למכון רמח״ל בדוא״ל.',
    eyebrow: 'שאלות ותשובות עם הרב מרדכי שריקי',
    title: 'שו״ת',
    lead: 'מקום לשאלות בענייני כתבי הרמח״ל, אמונה, קבלה ועבודת ה׳ — ולתשובות שאפשר ללמוד מהן גם לאחרים.',
    processTitle: 'איך שולחים שאלה',
    processSteps: [
      'כותבים למכון בדוא״ל ומוסיפים מעט רקע הנחוץ להבנת השאלה.',
      'בנו של הרב מרכז את השאלות ומעביר לרב את המתאימות להשבה.',
      'שאלה ותשובה מתפרסמות רק לאחר קבלת רשות מן השואל. אפשר לבקש להישאר בעילום שם.',
    ],
    emailAction: 'שליחת שאלה למכון',
    emailSubject: 'שאלה למדור שו״ת',
    emailUnavailable: 'כתובת הדוא״ל של המכון תופיע כאן לאחר שתוגדר.',
    archiveTitle: 'ארכיון השו״ת',
    archiveIntroduction: 'כל שאלה נשמרת כיחידת לימוד בפני עצמה, עם נושא ברור וטקסט מלא שאפשר למצוא בחיפוש.',
    searchLabel: 'חיפוש בשו״ת',
    searchPlaceholder: 'מילה מן השאלה, התשובה או הנושא…',
    searchAction: 'חיפוש',
    clearSearch: 'ניקוי החיפוש',
    oneResult: 'שאלה אחת',
    noResultsCount: 'לא נמצאו שאלות',
    noResultsTitle: 'לא נמצאה תשובה מתאימה',
    noResultsBody: 'אפשר לנסות מילה אחרת, או לשלוח למכון שאלה חדשה.',
    sampleNumber: 'שו״ת א׳',
    sampleLabel: 'תוכן לדוגמה',
    topicLabel: 'נושא',
    answerLabel: 'תשובה',
    sampleDisclaimer: 'תשובה זו נכתבה לצורכי עיצוב בלבד ואינה תשובה מאת הרב מרדכי שריקי.',
    question: {
      topic: 'לימוד כתבי הרמח״ל',
      title: 'מהי הדרך הנכונה להתחיל ללמוד את כתבי הרמח״ל?',
      body: 'ישנם ספרים רבים ושיעורים רבים. האם נכון להתחיל במסילת ישרים, בדרך ה׳ או דווקא מספר אחר — ואיך בונים סדר לימוד שאפשר להתמיד בו?',
      answer: [
        'אין סדר אחד המתאים לכל אדם. מי שמבקש להתחיל מעבודת האדם וממידותיו עשוי למצוא שער נוח במסילת ישרים; מי שמבקש תמונה שיטתית של יסודות האמונה והנהגת הבורא יוכל לפתוח בדרך ה׳.',
        'העיקר הוא לבחור חיבור אחד, ללמוד אותו כסדרו ולא למהר. כדאי לקבוע זמן קבוע, לסכם כל פרק במילים פשוטות ולחזור אל המהלך השלם לפני שעוברים לספר נוסף.',
        'שיעור מלווה יכול לסייע במושגים ובמבנה, אך אינו מחליף את המפגש הישיר עם לשונו המדויקת של הרמח״ל.',
      ],
      mentionedWorksLabel: 'ספרים שנזכרו',
      mentionedWorks: ['מסילת ישרים', 'דרך ה׳'],
    },
  },
  en: {
    metadataTitle: 'Questions & Answers with Rabbi Mordechai Chriqui | Machon Ramhal',
    metadataDescription: 'Questions and answers with Rabbi Mordechai Chriqui on the Ramhal, Jewish thought, kabbalah and spiritual practice. Send a question to Machon Ramhal by email.',
    eyebrow: 'Questions and answers with Rabbi Mordechai Chriqui',
    title: 'Questions & Answers',
    lead: 'A place for questions about the Ramhal’s writings, Jewish thought, kabbalah and spiritual practice — with answers that can remain useful to other learners.',
    processTitle: 'How to send a question',
    processSteps: [
      'Write to the institute by email and include the background needed to understand the question.',
      'The Rabbi’s son gathers the questions and brings suitable ones to the Rabbi.',
      'A question and answer are published only with the asker’s permission. You may ask to remain anonymous.',
    ],
    emailAction: 'Email a question',
    emailSubject: 'Question for the Q&A section',
    emailUnavailable: 'The institute’s email address will appear here once configured.',
    archiveTitle: 'The Q&A archive',
    archiveIntroduction: 'Each question stands as a complete study entry, with a clear subject and full text that can be found through search.',
    searchLabel: 'Search the Q&A',
    searchPlaceholder: 'A word from the question, answer or subject…',
    searchAction: 'Search',
    clearSearch: 'Clear search',
    oneResult: 'One question',
    noResultsCount: 'No questions found',
    noResultsTitle: 'No matching answer was found',
    noResultsBody: 'Try another word, or send a new question to the institute.',
    sampleNumber: 'Responsum 1',
    sampleLabel: 'Sample content',
    topicLabel: 'Subject',
    answerLabel: 'Answer',
    sampleDisclaimer: 'This answer was written to demonstrate the design and is not an answer by Rabbi Mordechai Chriqui.',
    question: {
      topic: 'Studying the Ramhal’s writings',
      title: 'What is the right way to begin studying the Ramhal’s writings?',
      body: 'There are many books and many recorded lessons. Should one begin with Mesillat Yesharim, Derech Hashem or another work — and how can a lasting course of study be built?',
      answer: [
        'There is no single order that suits every reader. Someone beginning with character and spiritual practice may find Mesillat Yesharim the most approachable gateway; someone seeking a systematic account of faith and divine governance may begin with Derech Hashem.',
        'The important thing is to choose one work, study it in sequence and resist rushing. Set a regular time, restate each chapter in plain language and return to the whole argument before moving to another book.',
        'A supporting lesson can help with concepts and structure, but it does not replace a direct encounter with the Ramhal’s precise language.',
      ],
      mentionedWorksLabel: 'Works mentioned',
      mentionedWorks: ['Mesillat Yesharim', 'Derech Hashem'],
    },
  },
  fr: {
    metadataTitle: 'Questions–réponses avec le Rav Mordekhaï Chriqui | Institut Ramhal',
    metadataDescription: 'Questions et réponses avec le Rav Mordekhaï Chriqui sur le Ramhal, la pensée juive, la kabbale et le service divin. Envoyez votre question par e-mail.',
    eyebrow: 'Questions–réponses avec le Rav Mordekhaï Chriqui',
    title: 'Questions–réponses',
    lead: 'Un espace consacré aux questions sur les écrits du Ramhal, la pensée juive, la kabbale et le service divin — avec des réponses utiles à d’autres étudiants.',
    processTitle: 'Comment poser une question',
    processSteps: [
      'Écrivez à l’institut par e-mail en ajoutant le contexte nécessaire pour comprendre la question.',
      'Le fils du Rav rassemble les questions et lui transmet celles qui se prêtent à une réponse.',
      'Une question et sa réponse ne sont publiées qu’avec l’accord de la personne qui l’a posée. Vous pouvez demander à rester anonyme.',
    ],
    emailAction: 'Envoyer une question',
    emailSubject: 'Question pour la rubrique Questions–réponses',
    emailUnavailable: 'L’adresse e-mail de l’institut apparaîtra ici une fois configurée.',
    archiveTitle: 'Les questions–réponses',
    archiveIntroduction: 'Chaque question constitue une étude à part entière, avec un sujet clair et un texte intégral que la recherche permet de retrouver.',
    searchLabel: 'Rechercher dans les questions–réponses',
    searchPlaceholder: 'Un mot de la question, de la réponse ou du sujet…',
    searchAction: 'Rechercher',
    clearSearch: 'Effacer la recherche',
    oneResult: 'Une question',
    noResultsCount: 'Aucune question trouvée',
    noResultsTitle: 'Aucune réponse correspondante',
    noResultsBody: 'Essayez un autre mot ou envoyez une nouvelle question à l’institut.',
    sampleNumber: 'Réponse 1',
    sampleLabel: 'Contenu d’exemple',
    topicLabel: 'Sujet',
    answerLabel: 'Réponse',
    sampleDisclaimer: 'Cette réponse a été rédigée pour présenter la mise en page ; elle n’est pas une réponse du Rav Mordekhaï Chriqui.',
    question: {
      topic: 'Étudier les écrits du Ramhal',
      title: 'Par où commencer l’étude des écrits du Ramhal ?',
      body: 'Il existe de nombreux livres et de nombreux cours. Faut-il commencer par Messilat Yécharim, Derekh Hachem ou un autre ouvrage — et comment construire une étude durable ?',
      answer: [
        'Il n’existe pas un ordre unique qui convienne à chacun. Celui qui veut commencer par le travail de l’homme et de ses qualités trouvera dans Messilat Yécharim une porte d’entrée accessible ; celui qui cherche un exposé méthodique de la foi et de la conduite divine pourra commencer par Derekh Hachem.',
        'L’essentiel est de choisir un ouvrage, de l’étudier dans l’ordre et sans hâte. Il est utile de fixer un temps régulier, de résumer chaque chapitre avec des mots simples et de revenir à l’ensemble du raisonnement avant de passer à un autre livre.',
        'Un cours d’accompagnement peut éclairer les notions et la structure, mais il ne remplace pas la rencontre directe avec la langue précise du Ramhal.',
      ],
      mentionedWorksLabel: 'Ouvrages cités',
      mentionedWorks: ['Messilat Yécharim', 'Derekh Hachem'],
    },
  },
} as const

function readSearchQuery(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : value?.[0] ?? ''
}

export async function generateMetadata({ params }: PageProps<'/[locale]/questions-and-answers'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const content = CONTENT[locale]
  return { title: content.metadataTitle, description: content.metadataDescription }
}

export default async function QuestionsAndAnswersPage({ params, searchParams }: PageProps<'/[locale]/questions-and-answers'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const content = CONTENT[locale]
  const query = readSearchQuery((await searchParams).q)
  const question = content.question
  const hasResult = matchesQuestionSearch(
    [question.topic, question.title, question.body, ...question.answer, ...question.mentionedWorks],
    query,
  )
  const contact = await getContactDetails(locale)
  const emailHref = contact.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent(content.emailSubject)}`
    : null

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
            <h2 className="type-subheading text-teal-deep">{content.processTitle}</h2>
            <ol className="mt-5 flex flex-col gap-4">
              {content.processSteps.map((step, index) => (
                <li key={step} className="grid grid-cols-[1.5rem_1fr] gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden className="font-serif text-lg text-gold-ink">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-7">
              {emailHref ? (
                <a href={emailHref} className={buttonVariants({ size: 'lg' })}>
                  <Mail aria-hidden className="size-4" />
                  {content.emailAction}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">{content.emailUnavailable}</p>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="page-container py-14 lg:py-16">
        <div className="max-w-4xl">
          <SectionHeading>{content.archiveTitle}</SectionHeading>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">{content.archiveIntroduction}</p>
        </div>

        <form action={questionsPath(locale)} role="search" className="my-10 border-y border-border bg-paper-deep px-4 py-5 sm:px-6">
          <div className="flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-end">
            <Field className="flex-1">
              <FieldLabel htmlFor="question-search">{content.searchLabel}</FieldLabel>
              <Input
                id="question-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder={content.searchPlaceholder}
                className="bg-background"
              />
            </Field>
            <div className="flex items-center gap-2">
              <Button type="submit" className="sm:h-10">
                <Search aria-hidden className="size-4" />
                {content.searchAction}
              </Button>
              {query ? (
                <Link href={questionsPath(locale)} className={cn(buttonVariants({ variant: 'ghost' }), 'text-muted-foreground')}>
                  {content.clearSearch}
                </Link>
              ) : null}
            </div>
          </div>
        </form>

        <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">
          {hasResult ? content.oneResult : content.noResultsCount}
        </p>

        {hasResult ? (
          <article id="question-1" className="scroll-mt-8 border-t border-gold pt-8">
            <div className="grid gap-8 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-12">
              <header className="flex flex-col items-start gap-3">
                <p className="font-serif text-lg text-gold-ink">{content.sampleNumber}</p>
                <p className="border border-gold/60 bg-paper-deep px-2 py-1 text-xs font-semibold text-gold-ink">
                  {content.sampleLabel}
                </p>
                <dl className="mt-2 text-sm leading-relaxed">
                  <dt className="text-muted-foreground">{content.topicLabel}</dt>
                  <dd className="font-medium text-teal-deep">{question.topic}</dd>
                </dl>
              </header>

              <div className="max-w-3xl">
                <h2 className="type-heading">{question.title}</h2>
                <p className="mt-5 border-s-[3px] border-teal ps-5 text-lg leading-[1.8]">{question.body}</p>

                <div className="mt-10 border-t border-border pt-8">
                  <p className="mb-4 text-sm font-semibold text-teal">{content.answerLabel}</p>
                  <p className="mb-6 border border-gold/50 bg-paper-deep px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                    {content.sampleDisclaimer}
                  </p>
                  <div className="type-prose flex flex-col gap-5 text-lg">
                    {question.answer.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                <footer className="mt-10 border-t border-border pt-5 text-sm">
                  <span className="text-muted-foreground">{question.mentionedWorksLabel}: </span>
                  <span>{question.mentionedWorks.join(' · ')}</span>
                </footer>
              </div>
            </div>
          </article>
        ) : (
          <div className="border-t border-gold py-14 text-center">
            <h2 className="type-heading">{content.noResultsTitle}</h2>
            <p className="mt-3 text-muted-foreground">{content.noResultsBody}</p>
          </div>
        )}
      </section>
    </article>
  )
}
