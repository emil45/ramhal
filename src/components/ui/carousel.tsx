"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins
  )

  const subscribe = React.useCallback(
    (notify: () => void) => {
      if (!api) return () => undefined

      const handleChange = () => notify()
      api.on("reInit", handleChange)
      api.on("select", handleChange)

      return () => {
        api.off("reInit", handleChange)
        api.off("select", handleChange)
      }
    },
    [api]
  )

  const getSnapshot = React.useCallback(() => {
    if (!api) return "unavailable"
    return `${api.selectedScrollSnap()}:${api.canScrollPrev()}:${api.canScrollNext()}`
  }, [api])

  const carouselState = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => "unavailable"
  )
  const canScrollPrev = carouselState !== "unavailable" && (api?.canScrollPrev() ?? false)
  const canScrollNext = carouselState !== "unavailable" && (api?.canScrollNext() ?? false)

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const isRightToLeft = opts?.direction === "rtl"

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        if (isRightToLeft) scrollNext()
        else scrollPrev()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        if (isRightToLeft) scrollPrev()
        else scrollNext()
      }
    },
    [opts?.direction, scrollNext, scrollPrev]
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        orientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden" data-slot="carousel-content">
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ms-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel()

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "ps-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
}

type CarouselControlProps = React.ComponentProps<typeof Button> & {
  label?: string
}

function CarouselPrevious({
  className,
  label = "Previous slide",
  variant = "outline",
  size = "icon",
  ...props
}: CarouselControlProps) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute z-10 touch-manipulation rounded-full bg-background/95 shadow-sm",
        orientation === "horizontal"
          ? "inset-y-0 start-2 my-auto"
          : "start-1/2 -top-5 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      aria-label={label}
      {...props}
    >
      <ChevronLeft aria-hidden className="rtl:rotate-180" />
    </Button>
  )
}

function CarouselNext({
  className,
  label = "Next slide",
  variant = "outline",
  size = "icon",
  ...props
}: CarouselControlProps) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute z-10 touch-manipulation rounded-full bg-background/95 shadow-sm",
        orientation === "horizontal"
          ? "inset-y-0 end-2 my-auto"
          : "start-1/2 -bottom-5 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      aria-label={label}
      {...props}
    >
      <ChevronRight aria-hidden className="rtl:rotate-180" />
    </Button>
  )
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
}
