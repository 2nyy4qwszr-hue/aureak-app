'use client'
// Story tbd-notifs-inapp — Badge de notifications in-app dans la sidebar
import React from 'react'
import { useRouter } from 'expo-router'
import { colors } from '@aureak/theme'
import { useNotification } from './NotificationContext'

export function NotificationBadge() {
  const router = useRouter()
  const { count } = useNotification()

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
