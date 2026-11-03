import type { SerializedEditorState } from 'lexical'

/** The structural shape shared by Payload rich-text fields and the storefront
 * renderer, without tying pure view-model code to a collection type. */
export type RichTextContent = SerializedEditorState
