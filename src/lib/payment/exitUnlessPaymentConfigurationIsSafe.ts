import { readPaymentProviderName } from '@/lib/payment/paymentConfiguration'

/**
 * Stops the process — non-zero exit, message on stderr — when the payment
 * configuration must not serve. Throwing from Next's startup hook is not
 * enough: `next start` reports it, then keeps running and answers every
 * request with a 500. A process that is up but broken passes a port-open
 * health check; a process that has exited does not.
 */
export function exitUnlessPaymentConfigurationIsSafe(): void {
  try {
    readPaymentProviderName()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
