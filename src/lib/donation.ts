const PAYPAL_HOSTS = ['paypal.com', 'paypal.me'] as const

function isPaypalHost(hostname: string): boolean {
  return PAYPAL_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))
}

/**
 * A missing URL deliberately means "show the placeholder". A configured URL
 * must be an HTTPS PayPal destination so a typo cannot turn the donation call
 * to action into a link to an unrelated payment page.
 */
export function parsePaypalDonationUrl(value: string | undefined): string | null {
  const candidate = value?.trim()
  if (!candidate) return null

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    throw new Error('PAYPAL_DONATION_URL must be a valid HTTPS PayPal URL.')
  }

  if (url.protocol !== 'https:' || !isPaypalHost(url.hostname.toLowerCase())) {
    throw new Error('PAYPAL_DONATION_URL must use HTTPS on paypal.com or paypal.me.')
  }

  return url.toString()
}

export function readPaypalDonationUrl(): string | null {
  return parsePaypalDonationUrl(process.env.PAYPAL_DONATION_URL)
}
