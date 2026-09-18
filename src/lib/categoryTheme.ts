// Ground colour for a typographic fallback cover (docs/tasks/TASK-06-storefront.md
// §5), one per known category slug, drawn from the brand palette — never an
// arbitrary colour outside it (§6). A book without a resolved category still
// gets a real cover via the default entry, never a missing-image box.
export type CategoryTheme = {
  background: string
  border: string
  text: string
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  'hebrew-books': { background: '#e4f0f0', border: '#00707c', text: '#004f58' },
  'french-books': { background: '#f3ecdd', border: '#b08d42', text: '#5c481f' },
  'english-books': { background: '#e6eef0', border: '#004f58', text: '#00363d' },
  'siddurim-machzorim': { background: '#f3e9e2', border: '#b08d42', text: '#5c3d1f' },
  'cd-dvd': { background: '#eceef0', border: '#5b6b70', text: '#33403f' },
}

const DEFAULT_THEME: CategoryTheme = { background: '#eef2f0', border: '#00707c', text: '#004f58' }

export function categoryTheme(categorySlug: string | null | undefined): CategoryTheme {
  if (!categorySlug) return DEFAULT_THEME
  return CATEGORY_THEMES[categorySlug] ?? DEFAULT_THEME
}
