// Story 100.2 — Auto-scroll de l'onglet actif dans une nav secondaire scrollable
// Web-only (Expo Router admin web). Repose sur `nativeID` → HTML id côté RN Web.
import { useEffect } from 'react'

/**
 * Scroll automatiquement l'onglet actif au centre de la ScrollView horizontale.
 *
 * Usage :
 *   useScrollTabIntoView('tab-activites', activeKey)
 *   // sur chaque Pressable : nativeID={`tab-activites-${tab.key}`}
 */
export function useScrollTabIntoView(
  prefix: string,
  activeKey: string | null | undefined,
) {
  useEffect(() => {
    if (!activeKey) return
    if (typeof document === 'undefined') return
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return

    // setTimeout 50ms : attendre que le ScrollView RN Web ait fini son layout.
    // Scroll programmatique direct sur le parent — plus fiable que
    // scrollIntoView sur les ScrollView RN Web (qui ignore parfois les options).
    // Utiliser getBoundingClientRect pour obtenir la position absolue de l'élément,
    // puis la transformer en offset au sein du parent scrollable (offsetLeft peut
    // être relatif à un offsetParent différent du parent scrollable).
    const scrollActiveIntoView = () => {
      const el = document.getElementById(`${prefix}-${activeKey}`)
      if (!el) return false
      let parent: HTMLElement | null = el.parentElement
      while (parent) {
        const ov = getComputedStyle(parent).overflowX
        if (ov === 'auto' || ov === 'scroll') break
        parent = parent.parentElement
      }
      if (!parent) return false
      const elRect     = el.getBoundingClientRect()
      const parentRect = parent.getBoundingClientRect()
      // Position de l'élément dans le contenu scrollable = rect.left relatif au parent + scrollLeft actuel
      const elOffsetInContent = (elRect.left - parentRect.left) + parent.scrollLeft
      const target            = elOffsetInContent + el.offsetWidth / 2 - parent.clientWidth / 2
      const maxScroll         = Math.max(0, parent.scrollWidth - parent.clientWidth)
      const clamped           = Math.max(0, Math.min(target, maxScroll))
      if (Math.abs(parent.scrollLeft - clamped) < 2) return true
      parent.scrollLeft = clamped
      return true
    }

    // 2 tentatives : 50ms (DOM prêt) + 300ms (layout RN stabilisé).
    const t1 = setTimeout(scrollActiveIntoView, 50)
    const t2 = setTimeout(scrollActiveIntoView, 300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [prefix, activeKey])
}
