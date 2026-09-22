/** The institute's logo on the admin login screen — see
 * docs/PROJECT_CONTEXT.md §13 for the asset. Only logo file available today;
 * a purpose-cropped mark can replace it later without touching this slot. */
export function Logo() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="מכון רמח״ל" width={220} height={220} style={{ objectFit: 'contain' }} />
}
