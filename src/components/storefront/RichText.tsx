import type { RichTextContent } from '@/lib/richText'

type LexicalTextNode = { text?: string; type: string }
type LexicalParagraphNode = { children?: LexicalTextNode[]; direction?: 'ltr' | 'rtl' | null; type: string }

/**
 * Minimal Lexical renderer for richText fields — every one imported so far
 * is plain text in single-run paragraphs (see importBooks.ts's
 * toLexicalRichText), so this only needs to render paragraphs and text
 * runs, not marks, links, or blocks. Extend when a real formatted document
 * shows up in the admin, not before.
 */
export function RichText({ content }: { content: RichTextContent }) {
  const children = (content.root.children ?? []) as LexicalParagraphNode[]

  return (
    <div className="flex flex-col gap-4 text-base leading-relaxed text-foreground">
      {children.map((node, index) => {
        const text = (node.children ?? []).map((child) => child.text ?? '').join('')
        if (!text) return null
        return (
          <p key={index} dir={node.direction ?? undefined}>
            {text}
          </p>
        )
      })}
    </div>
  )
}
