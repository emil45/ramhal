import { getPaymentProvider } from '@/lib/payment/getPaymentProvider'

/**
 * Stops the process — non-zero exit, message on stderr — when the payment
 * configuration must not serve. Throwing from Next's startup hook is not
 * enough: `next start` reports it, then keeps running and answers every
 * request with a 500. A process that is up but broken passes a port-open
 * health check; a process that has exited does not.
 *
 * Constructs the whole configured provider, not just its name — a real
 * provider's own required variables (PayPal's client id/secret/webhook id)
 * must fail loudly at boot too, not at the first checkout.
 */
export function exitUnlessPaymentConfigurationIsSafe(): void {
  try {
    getPaymentProvider()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
