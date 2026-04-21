'use client'
// Story 87.3 — Section "Historique des accès" de l'onglet Accès.
// Fusion rôles + overrides (actifs + soft-deleted) → timeline desc max 30.

import { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { AureakText, ROLE_LABELS } from '@aureak/ui'
import { listUserRolesHistory, listUserOverridesHistory } from '@aureak/api-client'
import type {
  UserRow, UserRoleHistoryEntry, UserSectionOverrideHistoryEntry,
} from '@aureak/api-client'
import { SECTION_KEY_LABELS } from '@aureak/types'
import type { SectionKey } from '@aureak/types'
import { colors, fonts, space } from '@aureak/theme'
import { cardStyles } from '../_card'
import { formatRelativeDate } from '../../../../../../components/admin/academie/formatRelativeDate'

type AccessEvent = {
  kind      : 'role_assigned' | 'role_revoked' | 'override_created' | 'override_removed'
  timestamp : string
  label     : string
  detail    : string
  icon      : string
}

const MAX_DEFAULT = 30

function fmtAbs(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function buildEvents(
  roles    : UserRoleHistoryEntry[],
  overrides: UserSectionOverrideHistoryEntry[],
): AccessEvent[] {
  const events: AccessEvent[] = []

  for (const r of roles) {
    if (r.createdAt) {
      events.push({
        kind     : 'role_assigned',
        timestamp: r.createdAt,
        icon     : '🧑‍💼',
        label    : 'Rôle ajouté',
        detail   : ROLE_LABELS[r.role],
      })
    }
    if (r.deletedAt) {
      events.push({
        kind     : 'role_revoked',
        timestamp: r.deletedAt,
        icon     : '🚫',
        label    : 'Rôle retiré',
        detail   : ROLE_LABELS[r.role],
      })
    }
  }

  for (const o of overrides) {
    const sectionLabel = SECTION_KEY_LABELS[o.sectionKey as SectionKey] ?? o.sectionKey
    const grantedLabel = o.granted ? 'granted' : 'denied'
    if (o.grantedAt) {
      events.push({
        kind     : 'override_created',
        timestamp: o.grantedAt,
        icon     : '🔓',
        label    : 'Override ajouté',
        detail   : `${grantedLabel} sur « ${sectionLabel} »`,
      })
    }
    if (o.deletedAt) {
      events.push({
        kind     : 'override_removed',
        timestamp: o.deletedAt,
        icon     : '🔒',
        label    : 'Override retiré',
        detail   : `${sectionLabel}`,
      })
    }
  }

  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

type HistoriqueSectionProps = {
  profile: UserRow
}

export function HistoriqueSection({ profile }: HistoriqueSectionProps) {
  const [events, setEvents]   = useState<AccessEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const run = async () => {
      try {
        const [roles, overrides] = await Promise.all([
          listUserRolesHistory(profile.userId),
          listUserOverridesHistory(profile.userId),
        ])
        if (cancelled) return
        setEvents(buildEvents(roles, overrides))
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[HistoriqueSection] load error:', err)
        if (!cancelled) setEvents([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [profile.userId])

  const visible = showAll ? events : events.slice(0, MAX_DEFAULT)

  return (
    <View style={cardStyles.card}>
      <AureakText style={cardStyles.title as TextStyle}>Historique des accès</AureakText>

      {loading ? (
        <AureakText style={cardStyles.muted as TextStyle}>Chargement…</AureakText>
      ) : events.length === 0 ? (
        <AureakText style={s.empty as TextStyle}>Aucun changement d'accès enregistré</AureakText>
      ) : (
        <>
          <View style={s.list}>
            {visible.map((evt, idx) => {
              const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.hover
              return (
                <View
                  key={`${evt.kind}-${evt.timestamp}-${idx}`}
                  style={[s.item, { backgroundColor: rowBg }] as never}
                >
                  <AureakText style={s.icon as TextStyle}>{evt.icon}</AureakText>
                  <View style={s.itemBody}>
                    <AureakText style={s.itemTitle as TextStyle}>
                      {evt.label} — <AureakText style={s.itemDetail as TextStyle}>{evt.detail}</AureakText>
                    </AureakText>
                    <AureakText style={s.itemDate as TextStyle}>
                      {formatRelativeDate(evt.timestamp)} · {fmtAbs(evt.timestamp)}
                    </AureakText>
                  </View>
                </View>
              )
            })}
          </View>

          {events.length > MAX_DEFAULT ? (
            <Pressable
              onPress={() => setShowAll(v => !v)}
              style={({ pressed }) => [s.moreBtn, pressed && s.moreBtnPressed] as never}
            >
              <AureakText style={s.moreBtnLabel as TextStyle}>
                {showAll ? 'Afficher moins' : `Afficher plus (${events.length - MAX_DEFAULT} autres)`}
              </AureakText>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  empty: { color: colors.text.muted, fontSize: 13, fontStyle: 'italic' },

  list: { gap: 0 },
  item: {
    flexDirection    : 'row',
    alignItems       : 'flex-start',
    gap              : space.sm,
    paddingHorizontal: 12,
    paddingVertical  : 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  icon      : { fontSize: 16, lineHeight: 20 },
  itemBody  : { flex: 1, gap: 2 },
  itemTitle : { fontSize: 13, color: colors.text.dark, fontFamily: fonts.body, fontWeight: '600' },
  itemDetail: { fontSize: 13, color: colors.text.muted, fontWeight: '400' },
  itemDate  : { fontSize: 11, color: colors.text.muted },

  moreBtn       : { alignSelf: 'center', marginTop: space.sm, paddingHorizontal: space.md, paddingVertical: 6 },
  moreBtnPressed: { opacity: 0.7 },
  moreBtnLabel  : { fontSize: 12, color: colors.accent.gold, fontWeight: '700', letterSpacing: 0.3 },
})
