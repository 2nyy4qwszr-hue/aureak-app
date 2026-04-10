import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { colors, radius, shadows, transitions } from '@aureak/theme'

// ── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export type ToastAction = { label: string; onPress: () => void }

export interface Toast {
  id       : string
  type     : ToastType
  message  : string
  duration?: number
  action?  : ToastAction
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number, action?: ToastAction) => void
  success  : (message: string, action?: ToastAction) => void
  error    : (message: string) => void
  info     : (message: string) => void
  warning  : (message: string) => void
}

// ── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ── Icons ────────────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { icon: string; bg: string; border: string; text: string }> = {
  success: { icon: '✓', bg: '#F0FDF4', border: colors.status.success,   text: '#166534' },
  error  : { icon: '✕', bg: '#FEF2F2', border: colors.status.errorStrong,       text: '#991B1B' },
  warning: { icon: '!', bg: '#FFFBEB', border: '#F59E0B',               text: '#92400E' },
  info   : { icon: 'i', bg: colors.light.muted, border: colors.accent.gold, text: colors.text.dark },
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    if (timerRefs.current[id]) {
      clearTimeout(timerRefs.current[id])
      delete timerRefs.current[id]
    }
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000, action?: ToastAction) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const toast: Toast = { id, type, message, duration, action }
    setToasts(prev => [...prev.slice(-4), toast]) // max 5 toasts
    timerRefs.current[id] = setTimeout(() => removeToast(id), duration)
  }, [removeToast])

  const success = useCallback((msg: string, action?: ToastAction) => showToast(msg, 'success', 4000, action), [showToast])
  const error   = useCallback((msg: string) => showToast(msg, 'error', 6000), [showToast])
  const info    = useCallback((msg: string) => showToast(msg, 'info'), [showToast])
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position      : 'fixed',
          bottom        : 24,
          right         : 24,
          zIndex        : 9999,
          display       : 'flex',
          flexDirection : 'column',
          gap           : 8,
          pointerEvents : 'none',
        }}
      >
        {toasts.map(toast => {
          const cfg = TOAST_CONFIG[toast.type]
          return (
            <div
              key={toast.id}
              style={{
                backgroundColor: cfg.bg,
                border         : `1px solid ${cfg.border}`,
                borderLeft     : `4px solid ${cfg.border}`,
                borderRadius   : radius.xs,
                boxShadow      : shadows.md,
                padding        : '12px 16px',
                display        : 'flex',
                alignItems     : 'center',
                gap            : 10,
                minWidth       : 280,
                maxWidth       : 400,
                pointerEvents  : 'auto',
                animation      : 'slideInRight 0.2s ease-out',
              }}
            >
              <span
                style={{
                  width          : 22,
                  height         : 22,
                  borderRadius   : '50%',
                  backgroundColor: cfg.border + '22',
                  display        : 'flex',
                  alignItems     : 'center',
                  justifyContent : 'center',
                  fontSize       : 12,
                  fontWeight     : 700,
                  color          : cfg.border,
                  flexShrink     : 0,
                  border         : `1.5px solid ${cfg.border}40`,
                }}
              >
                {cfg.icon}
              </span>
              <span
                style={{
                  fontFamily: 'Geist, sans-serif',
                  fontSize  : 13,
                  color     : cfg.text,
                  flex      : 1,
                  lineHeight: 1.5,
                }}
              >
                {toast.message}
              </span>
              {toast.action && (
                <button
                  onClick={() => { toast.action!.onPress(); removeToast(toast.id) }}
                  style={{
                    background   : 'none',
                    border       : `1px solid ${cfg.border}`,
                    borderRadius : 4,
                    cursor       : 'pointer',
                    color        : cfg.border,
                    fontSize     : 11,
                    fontWeight   : 700,
                    padding      : '3px 8px',
                    flexShrink   : 0,
                    whiteSpace   : 'nowrap',
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background : 'none',
                  border     : 'none',
                  cursor     : 'pointer',
                  color      : cfg.text + '80',
                  fontSize   : 16,
                  padding    : '0 0 0 4px',
                  lineHeight : 1,
                  flexShrink : 0,
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

export default ToastProvider
