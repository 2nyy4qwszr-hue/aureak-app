'use client'
// Story 87.3 — Section "Permissions effectives" de l'onglet Accès.
// Grille sections × toggle override. Sélecteur de rôle = aperçu uniquement
// (ne modifie pas le rôle actif stocké, cf. Dev Notes story).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { AureakText, ROLE_LABELS } from '@aureak/ui'
import {
  listDefaultPermissions, listUserOverrides, listUserRoles,
  upsertUserOverride, deleteUserOverride,
} from '@aureak/api-client'
import type { UserRow } from '@aureak/api-client'
import type { SectionKey, UserRole, SectionPermissionRow, UserSectionOverrideRow } from '@aureak/types'
import { SECTION_KEYS, SECTION_KEY_LABELS } from '@aureak/types'
import { colors, fonts, space, radius } from '@aureak/theme'
import { cardStyles } from '../_card'

type Origin = 'default' | 'override'

type Row = {
  sectionKey: SectionKey
  effective : boolean
  origin    : Origin
}

type PermissionsSectionProps = {
  profile    : UserRow
  canMutate  : boolean
  selfUserId : string | null
}

export function PermissionsSection({ profile, canMutate, selfUserId }: PermissionsSectionProps) {
  const [defaults,   setDefaults]   = useState<SectionPermissionRow[]>([])
  const [overrides,  setOverrides]  = useState<UserSectionOverrideRow[]>([])
  const [roles,      setRoles]      = useState<UserRole[]>([])
  const [loading,    setLoading]    = useState(true)
  const [savingKey,  setSavingKey]  = useState<SectionKey | null>(null)
  const [viewRole,   setViewRole]   = useState<UserRole>(profile.userRole as UserRole)

  const reload = useCallback(async () => {
    const [def, ov, rs] = await Promise.all([
      listDefaultPermissions(),
      listUserOverrides(profile.userId),
      listUserRoles(profile.userId),
    ])
    setDefaults(def)
    setOverrides(ov)
    setRoles(rs)
  }, [profile.userId])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        await reload()
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PermissionsSection] load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [reload])

  // Rôles disponibles pour le SegmentedControl = rôle principal + rôles secondaires
  const availableRoles = useMemo(() => {
    const set = new Set<UserRole>([profile.userRole as UserRole, ...roles])
    return Array.from(set)
  }, [profile.userRole, roles])

  // Calcul matrice : pour chaque section, défaut du rôle affiché + override éventuel
  const rows: Row[] = useMemo(() => {
    const defaultsForRole = new Map<SectionKey, boolean>()
    defaults.filter(d => d.role === viewRole).forEach(d => {
      defaultsForRole.set(d.sectionKey, d.granted)
    })
    const overrideMap = new Map<SectionKey, boolean>()
    overrides.forEach(o => overrideMap.set(o.sectionKey, o.granted))

    return SECTION_KEYS.map(key => {
      const hasOverride = overrideMap.has(key)
      const effective   = hasOverride ? overrideMap.get(key)! : (defaultsForRole.get(key) ?? false)
      return {
        sectionKey: key,
        effective,
        origin    : (hasOverride ? 'override' : 'default') as Origin,
      }
    })
  }, [defaults, overrides, viewRole])

  const handleToggle = async (row: Row) => {
    // Warning auto-lockout : admin retirant son propre accès Administration
    const isSelf             = profile.userId === selfUserId
    const viewingAdmin       = viewRole === 'admin'
    const wouldDenyAdminSelf = isSelf && viewingAdmin && row.sectionKey === 'admin' && row.effective === true

    if (wouldDenyAdminSelf && typeof window !== 'undefined') {
      // eslint-disable-next-line no-alert
      const ok = window.confirm(
        "⚠ Tu es sur le point de te retirer l'accès à Administration. "
        + "Tu ne pourras plus retirer cet override toi-même. Continuer ?",
      )
      if (!ok) return
    }

    setSavingKey(row.sectionKey)
    try {
      if (row.origin === 'override') {
        await deleteUserOverride(profile.userId, row.sectionKey)
      } else {
        await upsertUserOverride(profile.userId, row.sectionKey, !row.effective)
      }
      await reload()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[PermissionsSection] toggle error:', err)
    } finally {
      setSavingKey(null)
    }
  }

  const isReadOnly = !canMutate

  return (
    <View style={[cardStyles.card, isReadOnly && s.readOnly] as never}>
      <View style={s.headerRow}>
        <AureakText style={cardStyles.title as TextStyle}>Permissions effectives</AureakText>
        {isReadOnly ? (
          <View style={s.readOnlyBadge}>
            <AureakText style={s.readOnlyLabel as TextStyle}>LECTURE SEULE</AureakText>
          </View>
        ) : null}
      </View>
      <AureakText style={s.subtitle as TextStyle}>
        Les sections accessibles pour cette personne avec son rôle actif. Un override admin
        force granted/denied quel que soit le défaut du rôle.
      </AureakText>

      {/* SegmentedControl rôles */}
      {availableRoles.length > 1 ? (
        <View style={s.segmentWrap}>
          {availableRoles.map(role => {
            const isActive = role === viewRole
            return (
              <Pressable
                key={role}
                onPress={() => setViewRole(role)}
                style={[s.segmentBtn, isActive && s.segmentBtnActive] as never}
              >
                <AureakText style={[s.segmentLabel, isActive && s.segmentLabelActive] as never}>
                  {ROLE_LABELS[role]}
                </AureakText>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      {loading ? (
        <AureakText style={cardStyles.muted as TextStyle}>Chargement…</AureakText>
      ) : (
        <View style={s.grid}>
          {rows.map(row => {
            const isSaving = savingKey === row.sectionKey
            return (
              <View key={row.sectionKey} style={[s.gridRow, isSaving && s.gridRowSaving] as never}>
                <AureakText style={s.cellLabel as TextStyle}>
                  {SECTION_KEY_LABELS[row.sectionKey]}
                </AureakText>
                <View style={s.cellIndicator}>
                  <View
                    style={[
                      s.dot,
                      row.effective
                        ? { backgroundColor: colors.status.present }
                        : { backgroundColor: colors.status.absent + '66' },
                    ] as never}
                  />
                  <AureakText style={s.dotLabel as TextStyle}>
                    {row.effective ? 'Accès autorisé' : 'Accès refusé'}
                  </AureakText>
                </View>
                <View style={s.cellOrigin}>
                  <AureakText
                    style={[
                      s.originLabel,
                      row.origin === 'override' ? s.originOverride : s.originDefault,
                    ] as never}
                  >
                    {row.origin === 'override' ? 'Override admin' : 'Défaut du rôle'}
                  </AureakText>
                  {!isReadOnly ? (
                    <Pressable
                      accessibilityLabel={
                        row.origin === 'override'
                          ? `Retirer l'override pour ${SECTION_KEY_LABELS[row.sectionKey]}`
                          : `Forcer ${row.effective ? 'denied' : 'granted'} pour ${SECTION_KEY_LABELS[row.sectionKey]}`
                      }
                      disabled={isSaving}
                      onPress={() => handleToggle(row)}
                      style={({ pressed }) => [
                        row.origin === 'override' ? s.removeBtn : s.forceBtn,
                        pressed && { opacity: 0.8 },
                      ] as never}
                    >
                      <AureakText
                        style={[
                          s.btnLabel,
                          row.origin === 'override' ? s.removeBtnLabel : s.forceBtnLabel,
                        ] as never}
                      >
                        {isSaving
                          ? '…'
                          : row.origin === 'override'
                            ? 'Retirer override'
                            : 'Forcer'}
                      </AureakText>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  readOnly : { opacity: 0.75 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },

  readOnlyBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor  : colors.status.attention + '20',
    borderRadius     : 4,
    borderWidth      : 1,
    borderColor      : colors.status.attention + '66',
  },
  readOnlyLabel: { fontSize: 9, fontWeight: '700', color: colors.status.attention, letterSpacing: 0.5 },

  subtitle: { fontSize: 12, fontStyle: 'italic', color: colors.text.muted },

  segmentWrap  : { flexDirection: 'row', gap: 0, alignSelf: 'flex-start', borderRadius: radius.xs, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light },
  segmentBtn   : { paddingVertical: 6, paddingHorizontal: space.md, backgroundColor: colors.light.surface },
  segmentBtnActive: { backgroundColor: colors.accent.gold },
  segmentLabel : { fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 0.5 },
  segmentLabelActive: { color: colors.text.dark },

  grid         : { gap: 0 },
  gridRow      : {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingVertical  : 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.md,
  },
  gridRowSaving: { opacity: 0.5 },

  cellLabel    : { flex: 1, fontSize: 13, color: colors.text.dark, fontWeight: '600', fontFamily: fonts.body },
  cellIndicator: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flex: 1 },
  cellOrigin   : { flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1.5, justifyContent: 'flex-end' },

  dot        : { width: 10, height: 10, borderRadius: 5 },
  dotLabel   : { fontSize: 11, color: colors.text.muted, fontFamily: fonts.body },

  originLabel   : { fontSize: 11, letterSpacing: 0.3 },
  originDefault : { color: colors.text.muted },
  originOverride: { color: colors.accent.gold, fontWeight: '700' },

  forceBtn       : { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.xs, backgroundColor: colors.accent.gold },
  forceBtnLabel  : { color: colors.text.dark },
  removeBtn      : { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.xs, backgroundColor: colors.status.absent + '40', borderWidth: 1, borderColor: colors.status.absent + '66' },
  removeBtnLabel : { color: colors.status.absent },
  btnLabel       : { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
})
