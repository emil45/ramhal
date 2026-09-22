import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { SectionHeading } from '@/components/storefront/SectionHeading'
import { isLocale } from '@/lib/locale'

const CONTENT = {
  he: {
    title: 'מדיניות פרטיות',
    metadataDescription: 'מדיניות הפרטיות של מכון רמח״ל: אילו נתונים נאספים, לשם מה, ומי יכול לפנות בשאלות.',
    paragraphs: [
      'מכון רמח״ל אוסף מידע אישי רק כשהוא דרוש להפעלת האתר.',
      'בעת הזמנה: שם, דוא״ל, טלפון וכתובת משלוח — לשם עיבוד ומשלוח ההזמנה בלבד. פרטי תשלום מוזנים ישירות בעמוד המאובטח של ספק הסליקה ואינם עוברים דרך שרתי האתר.',
      'עגלת קניות: קובץ עוגייה טכני (session cookie) המזהה את העגלה בין ביקורים. אין באתר כלי מעקב או ניתוח פרסומי.',
      'התחברות מנהלים: הכניסה לממשק הניהול מתבצעת דרך התחברות עם Google, המשתפת עם האתר את כתובת הדוא״ל של המנהל המחובר בלבד, לצורך זיהוי.',
      'לשאלות בנוגע לפרטיות ניתן לפנות אל המכון בפרטי הקשר המופיעים בתחתית האתר.',
    ],
  },
  en: {
    title: 'Privacy policy',
    metadataDescription: 'Machon Ramhal’s privacy policy: what data is collected, why, and who to contact with questions.',
    paragraphs: [
      'Machon Ramhal collects personal information only where it is needed to run the site.',
      'When placing an order: name, email, phone and shipping address — used solely to process and deliver the order. Payment details are entered directly on the payment provider’s own secure page and never pass through the site’s servers.',
      'Shopping cart: a technical session cookie identifies the cart between visits. The site uses no advertising or analytics tracking.',
      'Admin sign-in: access to the admin panel uses Google sign-in, which shares only the signed-in administrator’s email address with the site, for identification.',
      'For questions about privacy, contact the institute using the details in the site footer.',
    ],
  },
  fr: {
    title: 'Politique de confidentialité',
    metadataDescription: 'La politique de confidentialité de l’Institut Ramhal : quelles données sont collectées, pourquoi, et qui contacter.',
    paragraphs: [
      'L’Institut Ramhal ne collecte des informations personnelles que lorsque cela est nécessaire au fonctionnement du site.',
      'Lors d’une commande : nom, e-mail, téléphone et adresse de livraison — utilisés uniquement pour traiter et livrer la commande. Les informations de paiement sont saisies directement sur la page sécurisée du prestataire de paiement et ne transitent jamais par les serveurs du site.',
      'Panier : un cookie de session technique identifie le panier entre les visites. Le site n’utilise aucun outil de suivi publicitaire ou analytique.',
      'Connexion administrateur : l’accès à l’interface d’administration se fait via la connexion Google, qui ne partage avec le site que l’adresse e-mail de l’administrateur connecté, à des fins d’identification.',
      'Pour toute question relative à la confidentialité, contactez l’institut aux coordonnées indiquées en bas de page.',
    ],
  },
} as const

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  return { title: CONTENT[locale].title, description: CONTENT[locale].metadataDescription }
}

export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const content = CONTENT[locale]

  return (
    <article className="page-container max-w-3xl py-14 lg:py-16">
      <SectionHeading as="h1">{content.title}</SectionHeading>
      <div className="type-prose flex flex-col gap-5 text-lg">
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  )
}
