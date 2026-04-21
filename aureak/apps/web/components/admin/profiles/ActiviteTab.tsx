'use client'
// Story 87.2 — Onglet Activité : historique lifecycle (max 20 entrées, desc).
// Usage courant < 20 items → pas de pagination ici. À introduire si le besoin
// apparaît (cf. non-goals story).

import { useEffect, useState } from 'react'
import { View, StyleSheet, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { listLifecycleEvents } from '@aureak/api-client'
import type { UserRow } from '@aureak/api-client'
import { colors, fonts, space } from '@aureak/theme'
import { cardStyles } from './card'

type LifecycleEvent = {
  id        : string
  event_type: string
  actor_id  : string | null
  reason    : string | null
  created_at: string
}

const EVENT_LABELS: Record<string, string> = {
  created              : 'Compte créé',
  invited              : 'Invitation envoyée',
  invitation_accepted  : 'Invitation acceptée',
  activated            : 'Compte activé',
  suspended            : 'Compte suspendu',
  reactivated          : 'Compte réactivé',
  deletion_requested   : 'Suppression demandée',
  deleted              : 'Compte supprimé',
  role_changed         : 'Rôle modifié',
  role_assigned        : 'Rôle attribué',
  role_revoked         : 'Rôle révoqué',
  password_reset       : 'Mot de passe réinitialisé',
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type ActiviteTabProps = {
  profile: UserRow
}

export function ActiviteTab({ profile }: ActiviteTabProps) {
  const [events, setEvents]   = useState<LifecycleEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const run = async () => {
      try {
        const res = await listLifecycleEvents(profile.userId)
        if (cancelled) return
        const rows = ((res.data ?? []) as LifecycleEvent[]).slice(0, 20)
        setEvents(rows)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ActiviteTab] load error:', err)
        if (!cancelled) setEvents([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [profile.userId])

  return (
    <View style={cardStyles.card}>
      <AureakText style={cardStyles.title as TextStyle}>Historique des actions importantes</AureakText>

      {loading ? (
        <AureakText style={cardStyles.muted as TextStyle}>Chargement…</AureakText>
      ) : events.length === 0 ? (
        <AureakText style={s.emptyItalic as TextStyle}>Aucun événement enregistré</AureakText>
      ) : (
        <View style={s.list}>
          {events.map(evt => {
            const label = EVENT_LABELS[evt.event_type] ?? evt.event_type
            return (
              <View key={evt.id} style={s.item}>
                <View style={s.itemHead}>
                  <AureakText style={s.itemType as TextStyle}>{label}</AureakText>
                  <AureakText style={s.itemDate as TextStyle}>{fmtDateTime(evt.created_at)}</AureakText>
                </View>
                {evt.reason ? (
                  <AureakText style={s.itemReason as TextStyle}>{evt.reason}</AureakText>
                ) : null}
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  emptyItalic: { color: colors.text.muted, fontSize: 13, fontStyle: 'italic' },
  list       : { gap: space.sm },
  item       : {
    paddingVertical  : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : 2,
  },
  itemHead  : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  itemType  : { fontSize: 13, fontWeight: '700', color: colors.text.dark, fontFamily: fonts.body },
  itemDate  : { fontSize: 11, color: colors.text.muted },
  itemReason: { fontSize: 12, color: colors.text.muted, fontStyle: 'italic' },
})
