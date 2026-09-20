const URL_SLUG_BY_IMPORT_KEY: Readonly<Record<string, string>> = {
  'זוהר רשבי חב - פרשת נח, לך לך, וירא, - בהוצאת מכון רמחל':
    'זוהר-רשבי-חב-פרשת-נח-לך-לך-וירא-בהוצאת-מכון-רמחל-2',
  'la kabbale de la reparation': 'la-kabbale-de-la-reparation-2',
  'fr:דברות רמחל חה משיח': 'דברות-רמחל-חה-משיח-2',
}

/**
 * Three distinct legacy listings normalize to the same public slug as another
 * book. These reviewed overrides match the existing catalogue, so rebuilding a
 * fresh database preserves its established canonical URLs.
 */
export function getImportBookUrlSlug(importKey: string): string | undefined {
  return URL_SLUG_BY_IMPORT_KEY[importKey]
}
