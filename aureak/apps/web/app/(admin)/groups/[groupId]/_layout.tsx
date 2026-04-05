// Story 56-8 — Transition slide vers fiche joueur depuis la fiche groupe
// Injecte les keyframes CSS pour la navigation groups → children
// Animation : 300ms cubic-bezier(0.4, 0.0, 0.2, 1) avec respect prefers-reduced-motion
import { useEffect } from 'react'
import { Slot } from 'expo-router'

// CSS des animations de slide — injectées une seule fois dans le DOM
const SLIDE_CSS = `
/* Story 56-8 — Transitions slide groupe → joueur */
@keyframes slideInFromRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes slideOutToLeft {
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(-40%); opacity: 0; }
}
@keyframes slideInFromLeft {
  from { transform: translateX(-40%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes slideOutToRight {
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(100%); opacity: 0; }
}

/* Classe appliquée aux pages group → child */
.aureak-slide-in-right {
  animation: slideInFromRight 300ms cubic-bezier(0.4, 0.0, 0.2, 1) both;
  will-change: transform;
}
.aureak-slide-out-left {
  animation: slideOutToLeft 300ms cubic-bezier(0.4, 0.0, 0.2, 1) both;
  will-change: transform;
}
.aureak-slide-in-left {
  animation: slideInFromLeft 300ms cubic-bezier(0.4, 0.0, 0.2, 1) both;
  will-change: transform;
}
.aureak-slide-out-right {
  animation: slideOutToRight 300ms cubic-bezier(0.4, 0.0, 0.2, 1) both;
  will-change: transform;
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .aureak-slide-in-right,
  .aureak-slide-out-left,
  .aureak-slide-in-left,
  .aureak-slide-out-right {
    animation: none !important;
  }
}
`

const STYLE_ID = 'aureak-slide-transitions'

export default function GroupDetailLayout() {
  useEffect(() => {
    // Injection du CSS si pas déjà présent
    if (typeof document === 'undefined') return
    if (document.getElementById(STYLE_ID)) return

    const style = document.createElement('style')
    style.id        = STYLE_ID
    style.textContent = SLIDE_CSS
    document.head.appendChild(style)

    return () => {
      // On ne retire pas le style au unmount (la route parent reste montée)
    }
  }, [])

  return <Slot />
}
