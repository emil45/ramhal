// What the customer can do on the mock payment page: pay, decline (the
// "card was refused" path), or cancel (walk away). The demo shows the failure
// paths as readily as the happy one.
export const MOCK_PAYMENT_DECISIONS = ['paid', 'declined', 'cancelled'] as const
export type MockPaymentDecision = (typeof MOCK_PAYMENT_DECISIONS)[number]

export function isMockPaymentDecision(value: string): value is MockPaymentDecision {
  return (MOCK_PAYMENT_DECISIONS as readonly string[]).includes(value)
}
