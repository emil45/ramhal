'use client'

import { createContext, useContext, useState } from 'react'

type BookColorState = { selectedColorId: string | null; selectColor: (colorId: string) => void }

const BookColorContext = createContext<BookColorState | null>(null)

/**
 * Holds which colour of a book the visitor is looking at, so the picture, the
 * picker and the add-to-cart button — which sit in different columns of the
 * book page — agree. The first colour is shown until another is chosen.
 */
export function BookColorProvider({ children, firstColorId }: { children: React.ReactNode; firstColorId: string | null }) {
  const [selectedColorId, setSelectedColorId] = useState(firstColorId)
  return <BookColorContext value={{ selectedColorId, selectColor: setSelectedColorId }}>{children}</BookColorContext>
}

/** The chosen colour; null for a book with one colour, or outside a provider. */
export function useSelectedColorId(): string | null {
  return useContext(BookColorContext)?.selectedColorId ?? null
}

export function useSelectColor(): (colorId: string) => void {
  const state = useContext(BookColorContext)
  if (!state) throw new Error('useSelectColor must be used inside a BookColorProvider.')
  return state.selectColor
}
