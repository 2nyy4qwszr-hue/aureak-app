'use client'
// Story tbd-notifs-inapp — Badge de notifications in-app dans la sidebar
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { countUnreadNotifications } from '@aureak/api-client'
import { colors } from '@aureak/theme'

export function NotificationBadge() {
  const router = useRouter()
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    try {
      const { count: n } = await countUnreadNotifications()
      setCount(n)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[NotificationBadge] load error:', err)
    }
  }, [])

  useEffect(() => {
    load()
    // Rafraîchir toutes les 60 secondes
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [load])

  return (
    <button
      onClick={() => router.push('/notifications' as never)}
      style={{
        display        : 'flex',
        alignItems     : 'center',
        gap            : 8,
        padding        : '8px 12px',
        margin         : '0 8px',
        background     : 'none',
        border         : 'none',
        cursor         : 'pointer',
        borderRadius   : 6,
        width          : 'calc(100% - 16px)',
        boxSizing      : 'border-box' as const,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.light.muted }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
    >
      <span style={{ fontSize: 14, position: 'relative' }}>
        🔔
        {count > 0 && (
          <span style={{
            position       : 'absolute',
            top            : -4,
            right          : -4,
            backgroundColor: colors.accent.red,
            color          : '#fff',
            borderRadius   : '50%',
            fontSize       : 9,
            fontWeight     : 700,
            width          : 14,
            height         : 14,
            display        : 'flex',
            alignItems     : 'center',
            justifyContent : 'center',
            lineHeight     : 1,
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </span>
      <span style={{ fontSize: 13, color: count > 0 ? colors.text.dark : colors.text.muted, fontWeight: count > 0 ? 600 : 400 }}>
        Notifications{count > 0 ? ` (${count})` : ''}
      </span>
    </button>
  )
}
