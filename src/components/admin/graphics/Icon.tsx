import Image from 'next/image'

/** The institute's mark in the nav header — same asset as Logo.tsx, smaller. */
export function Icon() {
  return <Image src="/logo.png" alt="" width={32} height={32} style={{ objectFit: 'contain', borderRadius: '50%' }} />
}
