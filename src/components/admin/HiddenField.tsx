/**
 * Renders nothing in the edit form. For a field that must stay column-
 * eligible (unlike `admin.hidden`, which removes it from list columns too)
 * but has no business being an input a person edits directly — e.g.
 * `displayTitleLocale` (src/collections/fields/localizedDisplayTitleFields.ts),
 * shown only as the language badge in list views.
 */
export function HiddenField() {
  return null
}
