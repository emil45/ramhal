import { BookOpen, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type BookPreviewButtonProps = {
  /** Text already in the page's language: functions cannot cross from the server page into a client component. */
  labels: { close: string; openInTab: string; preview: string; title: string }
  url: string
}

/**
 * "Look inside": the book's reading copy in a large dialog, in the browser's
 * own PDF viewer. Phones show only the first page of an embedded PDF, so the
 * link under the viewer opens the whole file in its own tab, where every
 * browser pages through it properly.
 */
export function BookPreviewButton({ labels, url }: BookPreviewButtonProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className="w-fit" />}>
        <BookOpen aria-hidden />
        {labels.preview}
      </DialogTrigger>
      <DialogContent closeLabel={labels.close} className="flex h-[min(92vh,60rem)] w-[min(96vw,60rem)] max-w-none flex-col gap-2 bg-paper-deep p-3 sm:max-w-none">
        <DialogTitle className="pe-10 text-base">{labels.title}</DialogTitle>
        <iframe src={`${url}#view=FitH`} title={labels.title} className="min-h-0 w-full flex-1 rounded-[2px] bg-background" />
        <a href={url} target="_blank" rel="noopener" className="inline-flex w-fit items-center gap-1.5 text-sm text-teal underline-offset-4 hover:underline">
          <ExternalLink className="size-4" aria-hidden />
          {labels.openInTab}
        </a>
      </DialogContent>
    </Dialog>
  )
}
