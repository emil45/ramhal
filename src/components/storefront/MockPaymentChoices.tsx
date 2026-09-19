'use client'

import { useTransition } from 'react'

import { chooseMockPaymentOutcome } from '@/app/(frontend)/mockPaymentActions'
import { Button } from '@/components/ui/button'

import type { ComponentProps } from 'react'
import type { MockPaymentDecision } from '@/lib/payment/mockPaymentDecision'

const BUTTON_VARIANTS: Record<MockPaymentDecision, ComponentProps<typeof Button>['variant']> = {
  paid: 'default',
  declined: 'destructive',
  cancelled: 'outline',
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
        <Button
          key={decision}
          size="lg"
          variant={BUTTON_VARIANTS[decision]}
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const { returnUrl } = await chooseMockPaymentOutcome(providerRef, decision)
              window.location.assign(returnUrl)
            })
          }
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
