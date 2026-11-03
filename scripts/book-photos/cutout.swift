// Cuts the book out of a phone photo: reads an image, asks macOS Vision for the
// foreground and writes a PNG that is transparent everywhere except the book.
//
//   swiftc -O cutout.swift -o cutout && ./cutout <photo> <output.png>
//
// No generative step is involved: pixels are kept or made transparent, never
// invented, so Hebrew lettering on a cover is never redrawn.
import CoreImage
import Foundation
import Vision

let arguments = CommandLine.arguments
guard arguments.count == 3 else {
    FileHandle.standardError.write(Data("usage: cutout <photo> <output.png>\n".utf8))
    exit(2)
}

let context = CIContext()
guard let photo = CIImage(contentsOf: URL(fileURLWithPath: arguments[1]), options: [.applyOrientationProperty: true]) else {
    FileHandle.standardError.write(Data("cannot read \(arguments[1])\n".utf8))
    exit(1)
}

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: photo)
try handler.perform([request])
guard let observation = request.results?.first else {
    FileHandle.standardError.write(Data("no foreground found in \(arguments[1])\n".utf8))
    exit(1)
}

let maskBuffer = try observation.generateScaledMaskForImage(forInstances: observation.allInstances, from: handler)
let mask = CIImage(cvPixelBuffer: maskBuffer)
let cutout = photo.applyingFilter("CIBlendWithMask", parameters: [
    kCIInputBackgroundImageKey: CIImage.empty(),
    kCIInputMaskImageKey: mask,
])

try context.writePNGRepresentation(
    of: cutout,
    to: URL(fileURLWithPath: arguments[2]),
    format: .RGBA8,
    colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!
)
