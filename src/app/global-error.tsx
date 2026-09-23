'use client'

import { Assistant, David_Libre } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import styles from './global-error.module.css'

const assistant = Assistant({ subsets: ['hebrew', 'latin'], variable: '--font-sans' })
const davidLibre = David_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-serif',
})

const CONTENT = {
  he: {
    direction: 'rtl',
    eyebrow: 'מכון רמח״ל',
    title: 'העמוד אינו זמין כרגע',
    message: 'אירעה תקלה זמנית. אפשר לנסות שוב בעוד רגע או לחזור לדף הבית.',
    retry: 'ניסיון נוסף',
    home: 'לדף הבית',
    homePath: '/',
  },
  en: {
    direction: 'ltr',
    eyebrow: 'Machon Ramhal',
    title: 'This page is temporarily unavailable',
    message: 'Something went wrong. Please try again in a moment or return to the home page.',
    retry: 'Try again',
    home: 'Return home',
    homePath: '/en',
  },
  fr: {
    direction: 'ltr',
    eyebrow: 'Institut Ramhal',
    title: 'Cette page est temporairement indisponible',
    message: 'Une erreur est survenue. Réessayez dans un instant ou revenez à la page d’accueil.',
    retry: 'Réessayer',
    home: 'Retour à l’accueil',
    homePath: '/fr',
  },
} as const

function contentForPath(pathname: string | null) {
  if (pathname === '/en' || pathname?.startsWith('/en/')) return CONTENT.en
  if (pathname === '/fr' || pathname?.startsWith('/fr/')) return CONTENT.fr
  return CONTENT.he
}

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const content = contentForPath(usePathname())

  return (
    <html lang={content.homePath === '/' ? 'he' : content.homePath.slice(1)} dir={content.direction} className={`${assistant.variable} ${davidLibre.variable}`}>
      <body className={styles.page}>
        <title>{content.title}</title>
        <main className={styles.main}>
          <section className={styles.panel} aria-labelledby="error-title">
            <Image className={styles.logo} src="/logo.png" alt="" width={362} height={512} priority />
            <p className={styles.eyebrow}>{content.eyebrow}</p>
            <h1 id="error-title" className={styles.title}>{content.title}</h1>
            <span className={styles.ornament} aria-hidden />
            <p className={styles.message}>{content.message}</p>
            <div className={styles.actions}>
              <button className={`${styles.action} ${styles.primaryAction}`} type="button" onClick={() => retry()}>
                {content.retry}
              </button>
              <Link className={`${styles.action} ${styles.secondaryAction}`} href={content.homePath}>
                {content.home}
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
