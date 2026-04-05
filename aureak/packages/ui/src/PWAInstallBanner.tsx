// Story 61.3 — PWAInstallBanner
// Banner d'installation PWA — affiché sur mobile Chrome/Safari uniquement
// SSR guard : typeof window !== 'undefined' avant tout accès window.*
// RÈGLE : removeEventListener sur 'beforeinstallprompt' dans cleanup useEffect
import React, { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { colors } from '@aureak/theme'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt      : () => Promise<void>
  userChoice  : Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ── Constantes ────────────────────────────────────────────────────────────────

const DISMISS_COUNT_KEY = 'aureak_pwa_dismiss_count'
const MAX_DISMISSALS    = 2

// ── Composant ─────────────────────────────────────────────────────────────────

export function PWAInstallBanner() {
  // Web uniquement (AC6)
  if (Platform.OS !== 'web') return null

  return <PWAInstallBannerWeb />
}

function PWAInstallBannerWeb() {
  const [show,              setShow]              = useState(false)
  const [showSafariPopover, setShowSafariPopover] = useState(false)
  const [isSafari,          setIsSafari]          = useState(false)
  const [visible,           setVisible]           = useState(false) // animation state
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // AC3 — déjà installé en mode standalone → ne jamais afficher
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // AC6 — vérif viewport mobile
    if (window.innerWidth >= 768) return

    // AC3 — refus répété → ne plus afficher
    const dismissCount = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) ?? '0', 10)
    if (dismissCount >= MAX_DISMISSALS) return

    // Détection Safari iOS (AC1)
    const ua         = navigator.userAgent
    const safariIOS  = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as Record<string, unknown>).MSStream
    setIsSafari(safariIOS)

    if (safariIOS) {
      // Safari : afficher immédiatement (pas d'event beforeinstallprompt)
      setShow(true)
      setTimeout(() => setVisible(true), 50) // trigger animation (AC4)
      return
    }

    // Chrome / Android : attendre beforeinstallprompt (AC1)
    const handler = (e: Event) => {
      e.preventDefault()
      promptRef.current = e as BeforeInstallPromptEvent
      setShow(true)
      setTimeout(() => setVisible(true), 50) // trigger animation
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler) // BLOCKER cleanup
    }
  }, [])

  const handleInstall = async () => {
    if (isSafari) {
      setShowSafariPopover(true)
      return
    }
    if (!promptRef.current) return
    try {
      await promptRef.current.prompt()
      const choice = await promptRef.current.userChoice
      if (choice.outcome === 'accepted') {
        setShow(false)
        setVisible(false)
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[PWAInstallBanner] prompt error:', err)
      }
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => setShow(false), 350)
    try {
      const count = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) ?? '0', 10)
      localStorage.setItem(DISMISS_COUNT_KEY, String(count + 1))
    } catch { /* noop */ }
  }

  if (!show) return null

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes aureak-slide-up-banner {
          from { transform: translateY(64px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .aureak-pwa-banner {
          position        : fixed;
          bottom          : 0;
          left            : 0;
          right           : 0;
          height          : 64px;
          background      : ${colors.dark.surface};
          border-top      : 2px solid ${colors.accent.gold};
          display         : flex;
          align-items     : center;
          padding         : 0 16px;
          gap             : 12px;
          z-index         : 9000;
          animation       : aureak-slide-up-banner 0.3s ease forwards;
          transition      : transform 0.3s ease, opacity 0.3s ease;
        }
        .aureak-pwa-banner.hidden {
          transform : translateY(64px);
          opacity   : 0;
        }
      `}</style>

      {/* Banner (AC4, AC7) */}
      <div
        className={`aureak-pwa-banner${!visible ? ' hidden' : ''}`}
        role="banner"
        aria-label="Installer l'application Aureak"
      >
        <span style={{ fontSize: 24, flexShrink: 0 }}>📱</span>

        <span style={{
          flex      : 1,
          fontSize  : 13,
          color     : colors.dark.text,
          fontFamily: 'Montserrat, sans-serif',
          lineHeight: '1.3',
        }}>
          Installer l'app Aureak sur votre écran d'accueil
        </span>

        {/* Bouton Installer (AC2) */}
        <button
          onClick={handleInstall}
          aria-label="Installer l'application Aureak"
          style={{
            background   : colors.accent.gold,
            color        : '#1A1A1A',
            border       : 'none',
            borderRadius : 8,
            padding      : '8px 14px',
            fontFamily   : 'Montserrat, sans-serif',
            fontSize     : 12,
            fontWeight   : '700',
            cursor       : 'pointer',
            flexShrink   : 0,
          }}
        >
          Installer
        </button>

        {/* Bouton Plus tard (AC2) */}
        <button
          onClick={handleDismiss}
          aria-label="Reporter l'installation"
          style={{
            background: 'transparent',
            border    : 'none',
            color     : colors.dark.textMuted,
            fontFamily: 'Montserrat, sans-serif',
            fontSize  : 12,
            cursor    : 'pointer',
            flexShrink: 0,
          }}
        >
          Plus tard
        </button>
      </div>

      {/* Popover instructions Safari (AC5) */}
      {showSafariPopover && (
        <SafariPopover onClose={() => setShowSafariPopover(false)} />
      )}
    </>
  )
}

// ── SafariPopover ─────────────────────────────────────────────────────────────

function SafariPopover({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position       : 'fixed',
      bottom         : 80,
      left           : '50%',
      transform      : 'translateX(-50%)',
      width          : 280,
      background     : colors.dark.elevated,
      border         : `1px solid ${colors.dark.border}`,
      borderRadius   : 12,
      padding        : 20,
      zIndex         : 9001,
      boxShadow      : '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      {/* Fermeture */}
      <button
        onClick={onClose}
        aria-label="Fermer les instructions"
        style={{
          position  : 'absolute',
          top       : 10,
          right     : 12,
          background: 'transparent',
          border    : 'none',
          color     : colors.dark.textMuted,
          fontSize  : 18,
          cursor    : 'pointer',
          lineHeight: 1,
        }}
      >
        ×
      </button>

      {/* SVG icône partage iOS inline (AC5) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.accent.gold} strokeWidth="2">
          <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316" />
          <path d="M12 5v9m-3-3l3-3 3 3" />
          <rect x="7" y="1" width="10" height="14" rx="2" />
        </svg>
        <span style={{ color: colors.dark.text, fontSize: 14, fontFamily: 'Montserrat, sans-serif', fontWeight: '600' }}>
          Installer sur Safari iOS
        </span>
      </div>

      <p style={{
        color     : colors.dark.textMuted,
        fontSize  : 13,
        fontFamily: 'Montserrat, sans-serif',
        lineHeight : '1.5',
        margin    : 0,
      }}>
        Appuyez sur{' '}
        <strong style={{ color: colors.dark.text }}>
          [l'icône de partage ↑]
        </strong>
        {' '}en bas de Safari, puis sélectionnez{' '}
        <strong style={{ color: colors.accent.gold }}>
          "Sur l'écran d'accueil"
        </strong>
        .
      </p>
    </div>
  )
}
