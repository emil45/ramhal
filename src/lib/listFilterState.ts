type SearchParameters = Record<string, string | string[] | undefined>

const WHERE_PARAMETER_PREFIX = 'where['

/** The condition part of a list URL, as a comparable string: Payload keeps a list's filter in `where[...]` parameters. */
function conditionSignature(parameters: Iterable<[string, string | string[] | undefined]>): string {
  return [...parameters]
    .filter(([key]) => key.startsWith(WHERE_PARAMETER_PREFIX))
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : (value ?? '')}`)
    .sort()
    .join('&')
}

/** Whether a one-click filter link is the view the editor is looking at right now. */
export function isActiveListFilter(filterHref: string, currentSearchParameters: SearchParameters): boolean {
  const filterQuery = new URLSearchParams(filterHref.split('?')[1] ?? '')
  return conditionSignature(filterQuery.entries()) === conditionSignature(Object.entries(currentSearchParameters))
}
