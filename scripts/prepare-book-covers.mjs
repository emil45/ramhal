import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const assetDirectory = new URL('../assets/book-covers/', import.meta.url)
const sourceManifest = JSON.parse(await readFile(new URL('manifest.json', assetDirectory), 'utf8'))
const preparation = JSON.parse(await readFile(new URL('preparation.json', assetDirectory), 'utf8'))
const outputDirectory = new URL('prepared/', assetDirectory)
const { width, height, bookHeight, maximumWidth } = preparation.canvas
await mkdir(outputDirectory, { recursive: true })

const preparedCovers = []
for (const cover of preparation.covers) {
  const product = sourceManifest.products.find((product) => product.identifier === cover.identifier)
  if (!product) throw new Error(`Unknown source product: ${cover.identifier}`)
  const source = product.images[0]
  const sourceBytes = await readFile(new URL(source.file, assetDirectory))
  const sourceChecksum = createHash('sha256').update(sourceBytes).digest('hex')
  if (sourceChecksum !== source.sha256) throw new Error(`Source changed: ${source.file}`)

  // These individually traced silhouettes keep white page edges and dark cover
  // artwork intact, unlike a colour-key operation applied across the whole image.
  const mask = Buffer.from(`<svg width="${source.width}" height="${source.height}" xmlns="http://www.w3.org/2000/svg"><path d="${cover.outline}" fill="white"/></svg>`)
  const isolated = await sharp(sourceBytes)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
  const { data: pixels, info } = await sharp(isolated).raw().toBuffer({ resolveWithObject: true })
  let minimumX = info.width
  let minimumY = info.height
  let maximumX = -1
  let maximumY = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (pixels[(y * info.width + x) * info.channels + 3] === 0) continue
      minimumX = Math.min(minimumX, x)
      minimumY = Math.min(minimumY, y)
      maximumX = Math.max(maximumX, x)
      maximumY = Math.max(maximumY, y)
    }
  }
  if (maximumX < minimumX) throw new Error(`Empty silhouette: ${cover.name}`)
  const crop = { left: minimumX, top: minimumY, width: maximumX - minimumX + 1, height: maximumY - minimumY + 1 }
  const resized = await sharp(isolated)
    .extract(crop)
    .resize({ width: maximumWidth, height: bookHeight, fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer({ resolveWithObject: true })
  const placement = {
    left: Math.floor((width - resized.info.width) / 2),
    top: Math.floor((height - bookHeight) / 2) + bookHeight - resized.info.height,
  }
  const file = `${cover.name}.png`
  const output = await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized.data, ...placement }])
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(new URL(file, outputDirectory), output)
  preparedCovers.push({
    identifier: cover.identifier,
    title: product.title,
    file,
    width,
    height,
    source: source.file,
    sourceChecksum,
    sha256: createHash('sha256').update(output).digest('hex'),
    crop,
    placement,
    bookWidth: resized.info.width,
    bookHeight: resized.info.height,
    note: cover.note ?? 'Background and source shadow removed; cover artwork and angle retained.',
  })
}
await writeFile(new URL('manifest.json', outputDirectory), `${JSON.stringify({ format: 'lossless PNG with transparency', canvas: preparation.canvas, covers: preparedCovers }, null, 2)}\n`)
console.log(`Prepared ${preparedCovers.length} covers in ${outputDirectory.pathname}`)
