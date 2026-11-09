const ISRAEL_COUNTRY_CALLING_CODE = '972'
const LOCAL_MOBILE_PATTERN = /^05\d{8}$/

/**
 * The number in Israel's local mobile form (`0501234567`), or null when it is
 * not an Israeli mobile number. Grow's payment page accepts nothing else, and
 * customers type it in many shapes: with spaces or dashes, or with the +972
 * calling code in place of the leading zero.
 */
export function toIsraeliMobileNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  const localNumber = digits.startsWith(ISRAEL_COUNTRY_CALLING_CODE) ? `0${digits.slice(ISRAEL_COUNTRY_CALLING_CODE.length)}` : digits
  return LOCAL_MOBILE_PATTERN.test(localNumber) ? localNumber : null
}
