import { AspectRatio } from '@/components/ui/aspect-ratio'

import type { Page } from '@/payload-types'

type VideoBlock = Extract<NonNullable<Page['content']>[number], { blockType: 'video' }>

export function VideoView({ block }: { block: VideoBlock }) {
  return (
    <div className="max-w-5xl">
      <div className="border border-gold bg-background p-2 shadow-[0_14px_40px_rgb(0_79_88/0.10)]">
        <AspectRatio ratio={16 / 9} className="overflow-hidden bg-teal-deep">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${block.videoId}?rel=0`}
            title={block.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="size-full border-0"
          />
        </AspectRatio>
      </div>
    </div>
  )
}
