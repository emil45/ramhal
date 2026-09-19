'use client'

import { useTransition } from 'react'

import { chooseMockPaymentOutcome } from '@/app/(frontend)/mockPaymentActions'

import type { MockPaymentDecision } from '@/lib/payment/mockPaymentDecision'

const buttonBase = 'w-full rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60'

const BUTTON_STYLES: Record<MockPaymentDecision, string> = {
  paid: 'bg-teal text-white hover:bg-teal-deep',
  declined: 'border border-destructive text-destructive hover:bg-destructive/10',
  cancelled: 'border border-border text-muted-foreground hover:bg-muted',
}

type Labels = { pay: string; decline: string; cancel: string }

/** The three things a customer can do on the mock payment page. Leaves with a
 * full page load, the way a real processor sends the customer back. */
export function MockPaymentChoices({ labels, providerRef }: { labels: Labels; providerRef: string }) {
  const [isPending, startTransition] = useTransition()

  const choices: { decision: MockPaymentDecision; label: string }[] = [
    { decision: 'paid', label: labels.pay },
    { decision: 'declined', label: labels.decline },
    { decision: 'cancelled', label: labels.cancel },
  ]

  return (
    <div className="flex flex-col gap-3">
      {choices.map(({ decision, label }) => (
        <button
          key={decision}
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const { returnUrl } = await chooseMockPaymentOutcome(providerRef, decision)
              window.location.assign(returnUrl)
            })
          }
          className={`${buttonBase} ${BUTTON_STYLES[decision]}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
