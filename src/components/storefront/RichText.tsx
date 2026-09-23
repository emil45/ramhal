import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'

import { cn } from '@/lib/utils'

import type { RichTextContent } from '@/lib/richText'

/**
 * Renders a Payload richText field through the framework's own Lexical→JSX
 * converters (paragraphs, bold/italic, links, lists, blockquotes, headings) —
 * every editor-authored document, not just the plain single-run paragraphs
 * the original hand-rolled version supported.
 */
export function RichText({ className, content }: { className?: string; content: RichTextContent }) {
  return (
    <PayloadRichText
      data={content}
      className={cn('flex flex-col gap-4 text-base leading-relaxed text-foreground', className)}
    />
  )
}
