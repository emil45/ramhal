'use client'

import { Check, Copy, Mail, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'

type CopyState = 'idle' | 'copied' | 'failed'

type QuestionEmailActionsProps = {
  copiedLabel: string
  copyFailedLabel: string
  copyLabel: string
  email: string
  emailAction: string
  emailPrompt: string
  emailSubject: string
}

export function QuestionEmailActions({
  copiedLabel,
  copyFailedLabel,
  copyLabel,
  email,
  emailAction,
  emailPrompt,
  emailSubject,
}: QuestionEmailActionsProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle')

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const copyButtonLabel = copyState === 'copied' ? copiedLabel : copyState === 'failed' ? copyFailedLabel : copyLabel
  const CopyIcon = copyState === 'copied' ? Check : copyState === 'failed' ? TriangleAlert : Copy
  const emailHref = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}`

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm leading-relaxed text-muted-foreground">{emailPrompt}</p>
      <div className="flex w-full items-center justify-between gap-3 border-y border-gold/60 py-3">
        <a href={`mailto:${email}`} dir="ltr" className="font-medium text-teal-deep underline-offset-4 hover:text-teal hover:underline">
          {email}
        </a>
        <Button type="button" variant="ghost" size="sm" onClick={copyEmail} aria-live="polite">
          <CopyIcon aria-hidden className="size-4" />
          {copyButtonLabel}
        </Button>
      </div>
      <a href={emailHref} className={buttonVariants({ size: 'lg' })}>
        <Mail aria-hidden className="size-4" />
        {emailAction}
      </a>
    </div>
  )
}
