import { BookOpen, ExternalLink } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type BookPreviewButtonProps = {
  /** Text already in the page's language: functions cannot cross from the server page into a client component. */
  labels: { close: string; openInTab: string; preview: string; title: string }
  url: string
}

/**
 * A sample of the book: its PDF. With a mouse it opens in a large dialog, in the
 * browser's own PDF viewer. A touch screen cannot show a PDF inside a page — it
 * offers a file name and an "Open" button instead — so there the button is a plain
 * link that opens the file straight away in its own tab, where every browser pages
 * through it properly. The choice is the pointer, not the screen width: a tablet
 * is as unable to embed a PDF as a phone.
 */
export function BookPreviewButton({ labels, url }: BookPreviewButtonProps) {
  return (
    <>
      <a href={url} target="_blank" rel="noopener" className={cn(buttonVariants({ variant: 'outline' }), 'hidden w-fit [@media(pointer:coarse)]:inline-flex')}>
        <BookOpen aria-hidden />
        {labels.preview}
      </a>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" className="w-fit [@media(pointer:coarse)]:hidden" />}>
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
    </>
  )
}
