/**
 * The country the checkout form opens on. The visitor's own country comes
 * first, because that is where most people want their order sent; the language
 * is only a guess (a French reader may live in Israel). Either one is used only
 * if the shop ships there in the customer's currency, otherwise the first
 * country the form offers, so the form never opens on a destination it would
 * then refuse.
 */
export function defaultDestinationCountry(input: {
  servedCountries: readonly string[]
  visitorCountry: string | null
  languageCountry: string
}): string | undefined {
  const { servedCountries, visitorCountry, languageCountry } = input
  const preferred = [visitorCountry, languageCountry].find(
    (country) => country !== null && servedCountries.includes(country),
  )
  return preferred ?? servedCountries[0]
}
