import { FeatureCardsBlock } from './featureCards.ts'
import { GalleryBlock } from './gallery.ts'
import { ImageFigureBlock } from './imageFigure.ts'
import { LabeledListBlock } from './labeledList.ts'
import { QuoteBlock } from './quote.ts'
import { RichTextBlock } from './richText.ts'
import { SectionHeadingBlock } from './sectionHeading.ts'
import { StatGridBlock } from './statGrid.ts'
import { TagListBlock } from './tagList.ts'
import { VideoBlock } from './video.ts'

// Every block a Pages document's `content` field can contain. A sectionHeading
// block starts a new titled section; every block after it, up to the next
// sectionHeading, belongs to that section (src/lib/pageSections.ts groups
// them for rendering) — nothing here nests blocks inside blocks.
export const PAGE_CONTENT_BLOCKS = [
  SectionHeadingBlock,
  RichTextBlock,
  QuoteBlock,
  LabeledListBlock,
  ImageFigureBlock,
  GalleryBlock,
  StatGridBlock,
  FeatureCardsBlock,
  TagListBlock,
  VideoBlock,
]
