'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export type NavLink = {
  href: string
  label: string
  /** Further path prefixes that belong to this section, e.g. book pages under "books". */
  alsoActiveUnder?: string[]
}

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** The desktop navigation row. The section the visitor is in carries a short gold rule under its name, as a running head marks the chapter. */
export function NavLinks({ links }: { links: NavLink[] }) {
  // Hebrew path segments may arrive percent-encoded; the hrefs are not.
  const pathname = decodeURIComponent(usePathname())

  return (
    <ul className="flex items-center justify-center gap-1">
      {links.map((link) => {
        const active = [link.href, ...(link.alsoActiveUnder ?? [])].some((prefix) => isUnder(pathname, prefix))
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-14 items-center px-4 text-[1.0625rem] font-medium text-foreground transition-colors hover:text-teal',
                'after:absolute after:inset-x-4 after:bottom-0 after:h-[3px] after:bg-gold after:opacity-0 after:transition-opacity',
                'aria-[current=page]:text-teal-deep aria-[current=page]:after:opacity-100',
              )}
            >
              {link.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
