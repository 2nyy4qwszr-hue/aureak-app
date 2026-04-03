'use client'
// Story 11.2 — Permissions de contenu par grade
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import {
  listThemesWithGrades, listSituationsWithGrades,
  updateThemeGradeLevel, updateSituationGradeLevel,
} from '@aureak/api-client'
import type { GradeContentItem, CoachGradeLevel } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

const GRADES: CoachGradeLevel[] = ['bronze', 'silver', 'gold', 'platinum']

const GRADE_COLOR: Record<CoachGradeLevel, string> = {
  bronze  : '#CD7F32',
  silver  : '#9CA3AF',
  gold    : colors.accent.gold,
  platinum: '#E5E4E2',
}

const GRADE_LABEL: Record<CoachGradeLevel, string> = {
  bronze  : 'Bronze',
  silver  : 'Argent',
  gold    : 'Or',
  platinum: 'Platine',
}

type Tab = 'themes' | 'situations'

export default function GradePermissionsPage() {
  const [tab,      setTab]      = useState<Tab>('themes')
  const [themes,   setThemes]   = useState<GradeContentItem[]>([])
  const [situations, setSituations] = useState<GradeContentItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [thRes, siRes] = await Promise.all([
        listThemesWithGrades(),
        listSituationsWithGrades(),
      ])
      setThemes(thRes.data)
      setSituations(siRes.data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[GradePermissions] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleUpdate = async (item: GradeContentItem, grade: CoachGradeLevel) => {
    if (saving) return
    setSaving(item.id)
    try {
      if (item.resourceType === 'theme') {
        await updateThemeGradeLevel(item.id, grade)
        setThemes(prev => prev.map(t => t.id === item.id ? { ...t, requiredGradeLevel: grade } : t))
      } else {
        await updateSituationGradeLevel(item.id, grade)
        setSituations(prev => prev.map(s => s.id === item.id ? { ...s, requiredGradeLevel: grade } : s))
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[GradePermissions] update error:', err)
    } finally {
      setSaving(null)
    }
  }

  const items = tab === 'themes' ? themes : situations

  const countByGrade = (list: GradeContentItem[]) => {
    const counts: Record<CoachGradeLevel, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 }
    list.forEach(i => counts[i.requiredGradeLevel]++)
    return counts
  }
  const counts = countByGrade(items)

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <AureakText variant="h2" style={{ marginBottom: space.xs }}>Permissions par grade</AureakText>
      <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: space.md }}>
        Définissez le grade minimum requis pour accéder à chaque thème et situation pédagogique.
      </AureakText>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['themes', 'situations'] as Tab[]).map(t => (
          <Pressable key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <AureakText variant="caption" style={{ color: tab === t ? colors.accent.gold : colors.text.muted, fontWeight: '700' }}>
              {t === 'themes' ? `Thèmes (${themes.length})` : `Situations (${situations.length})`}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {/* Grade summary */}
      <View style={s.summary}>
        {GRADES.map(g => (
          <View key={g} style={s.summaryItem}>
            <View style={[s.gradeDot, { backgroundColor: GRADE_COLOR[g] }]} />
            <AureakText variant="caption" style={{ color: colors.text.muted }}>{GRADE_LABEL[g]}</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>{counts[g]}</AureakText>
          </View>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      ) : items.length === 0 ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Aucun contenu trouvé.</AureakText>
      ) : (
        items.map(item => {
          const isSaving = saving === item.id
          return (
            <View key={item.id} style={[s.card, !item.isActive && s.cardInactive]}>
              <View style={s.cardLeft}>
                <AureakText variant="body" style={{ fontWeight: '600', color: item.isActive ? colors.text.dark : colors.text.muted }}>
                  {item.title}
                </AureakText>
                {!item.isActive && (
                  <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>Inactif</AureakText>
                )}
              </View>
              <View style={s.gradeRow}>
                {GRADES.map(g => {
                  const isSelected = item.requiredGradeLevel === g
                  const color = GRADE_COLOR[g]
                  return (
                    <Pressable
                      key={g}
                      style={[
                        s.gradeBtn,
                        { borderColor: color },
                        isSelected && { backgroundColor: color },
                      ] as never}
                      onPress={() => !isSaving && handleUpdate(item, g)}
                      disabled={isSaving}
                    >
                      <AureakText
                        variant="caption"
                        style={{ color: isSelected ? '#fff' : color, fontSize: 10, fontWeight: '700' }}
                      >
                        {g === 'bronze' ? 'B' : g === 'silver' ? 'A' : g === 'gold' ? 'O' : 'P'}
                      </AureakText>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.light.primary },
  content     : { padding: space.xl, gap: space.md },
  tabs        : {
    flexDirection  : 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom   : space.sm,
  },
  tab         : { paddingVertical: 8, paddingHorizontal: space.md, marginBottom: -1 },
  tabActive   : { borderBottomWidth: 2, borderBottomColor: colors.accent.gold },
  summary     : {
    flexDirection  : 'row',
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    padding        : space.sm,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : space.md,
    flexWrap       : 'wrap',
  },
  summaryItem : { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gradeDot    : { width: 8, height: 8, borderRadius: 4 },
  card        : {
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
  },
  cardInactive: { opacity: 0.5 },
  cardLeft    : { flex: 1, gap: 2 },
  gradeRow    : { flexDirection: 'row', gap: 6 },
  gradeBtn    : {
    width        : 28,
    height       : 28,
    borderRadius : 14,
    borderWidth  : 2,
    alignItems   : 'center',
    justifyContent: 'center',
  },
})
