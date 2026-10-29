import Image from 'next/image'

/** The institute's logo on the admin login screen, sampled from the
 * institute's own 40th-anniversary logo file. Only logo file available
 * today; a purpose-cropped mark can replace it later without touching this
 * slot. Rendered through next/image so the browser downloads a resized
 * copy rather than the full-size original. */
export function Logo() {
  return <Image src="/logo.png" alt="מכון רמח״ל" width={156} height={220} priority style={{ objectFit: 'contain' }} />
}
