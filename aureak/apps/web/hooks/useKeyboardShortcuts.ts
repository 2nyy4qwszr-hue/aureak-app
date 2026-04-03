// useKeyboardShortcuts — Cmd+K (search), Cmd+N (new), Escape (close)
import { useEffect } from 'react'
import { useRouter, usePathname } from 'expo-router'
import { useSearch } from '../components/SearchContext'

const NEW_ROUTES: Record<string, string> = {
  '/clubs'     : '/clubs/new',
  '/children'  : '/children/new',
  '/stages'    : '/stages/new',
  '/seances'   : '/seances/new',
  '/groups'    : '/groups/new',
  '/users'     : '/users/new',
  '/methodologie/themes'    : '/methodologie/themes/new',
  '/methodologie/situations': '/methodologie/situations/new',
}

export function useKeyboardShortcuts() {
  const router   = useRouter()
  const pathname = usePathname()
  const { setOpen } = useSearch()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac  = navigator.platform.toUpperCase().includes('MAC')
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl+K — ouvre GlobalSearch
      if (modKey && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        return
      }

      // Cmd/Ctrl+N — route "nouveau" contextuelle
      if (modKey && e.key === 'n') {
        const newRoute = Object.entries(NEW_ROUTES).find(([base]) =>
          pathname === base || pathname.startsWith(base + '/'),
        )?.[1]
        if (newRoute) {
          e.preventDefault()
          router.push(newRoute as never)
        }
        return
      }

      // Escape — ferme la search
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [pathname, router, setOpen])
}
