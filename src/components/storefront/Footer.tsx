import type { Dictionary } from '@/app/(frontend)/dictionary'

export function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-muted-foreground">{dict.footer.rights}</div>
    </footer>
  )
}
