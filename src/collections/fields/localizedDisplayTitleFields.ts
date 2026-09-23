import type { Field } from 'payload'

/**
 * Two fields shared by every collection with a required, localized `title`:
 * `displayTitle` (he -> fr -> en, whichever exists) as `useAsTitle` so the
 * list, the relationship picker and the document header all show something
 * better than the localization plugin's own "<ללא כותרת>" placeholder, and
 * `displayTitleLocale` for a small language badge next to it.
 *
 * Both are real, stored, non-localized columns — NOT virtual. Payload
 * refuses a virtual field as `useAsTitle` unless it is linked to a
 * relationship (see src/collections/hooks/displayTitle.ts's comment for how
 * this was found). They are computed and overwritten on every save by
 * `computeDisplayTitleBeforeChange` (wired into the collection's own
 * `hooks.beforeChange`) — never edited by hand, and never fed back into
 * `title` itself.
 */
export function localizedDisplayTitleFields(): Field[] {
  return [
    {
      name: 'displayTitle',
      type: 'text',
      label: 'כותרת לתצוגה',
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'displayTitleLocale',
      type: 'text',
      label: 'שפת הכותרת המוצגת',
      admin: {
        // Not hidden like displayTitle: it needs to render as a list column
        // (the language badge), just never as a form input.
        readOnly: true,
        disableListFilter: true,
        components: {
          Cell: '/components/admin/LanguageBadge#LanguageBadge',
          Field: '/components/admin/HiddenField#HiddenField',
        },
      },
    },
  ]
}
