'use client'
// Situations pédagogiques — situations de jeu/entraînement concrètes
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologySituations, listMethodologyThemes } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import {
  METHODOLOGY_METHODS, METHODOLOGY_METHOD_COLOR,
  type MethodologyMethod,
} from '@aureak/types'
import type { MethodologySituation, MethodologyTheme } from '@aureak/types'

type FilterMethod = MethodologyMethod | 'all'

export default function SituationsPage() {
  const router = useRouter()

  const [situations,   setSituations]   = useState<MethodologySituation[]>([])
  const [themes,       setThemes]       = useState<MethodologyTheme[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [methodFilter, setMethodFilter] = useState<FilterMethod>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const [sits, thms] = await Promise.all([
      listMethodologySituations({ activeOnly: false }),
      listMethodologyThemes({ activeOnly: false }),
    ])
    setSituations(sits)
    setThemes(thms)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const themeMap = Object.fromEntries(themes.map(t => [t.id, t.title]))

  const filtered = situations.filter(s => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    if (methodFilter !== 'all' && s.method !== methodFilter) return false
    return true
  })

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.push('/methodologie' as never)} style={{ marginBottom: 4 }}>
          <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Méthodologie</AureakText>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <AureakText variant="h2">Situations</AureakText>
            {!loading && (
              <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 2 }}>
                {filtered.length} situation{filtered.length !== 1 ? 's' : ''}
              </AureakText>
            )}
          </View>
          <Pressable style={s.newBtn} onPress={() => router.push('/methodologie/situations/new' as never)}>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>+ Nouvelle situation</AureakText>
          </Pressable>
        </View>
      </View>

      {/* ── Search ── */}
      <TextInput
        style={s.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher par titre…"
        placeholderTextColor={colors.text.secondary}
      />

      {/* ── Method filter ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['all', ...METHODOLOGY_METHODS] as FilterMethod[]).map(m => {
            const active = methodFilter === m
            const color  = m === 'all' ? '#66BB6A' : METHODOLOGY_METHOD_COLOR[m as MethodologyMethod]
            return (
              <Pressable
                key={m}
                onPress={() => setMethodFilter(m)}
                style={[s.chip, { borderColor: active ? color : colors.accent.zinc, backgroundColor: active ? color + '20' : 'transparent' }]}
              >
                <AureakText variant="caption" style={{ color: active ? color : colors.text.secondary, fontWeight: active ? '700' : '400', fontSize: 12 }}>
                  {m === 'all' ? 'Toutes méthodes' : m}
                </AureakText>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>

      {/* ── List ── */}
      {loading ? (
        <AureakText variant="caption" style={{ color: colors.text.secondary }}>Chargement…</AureakText>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <AureakText variant="caption" style={{ color: colors.text.secondary, fontStyle: 'italic' }}>
            {situations.length === 0 ? 'Aucune situation. Créez la première.' : 'Aucun résultat pour ces filtres.'}
          </AureakText>
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          {filtered.map(sit => {
            const methodColor = sit.method ? (METHODOLOGY_METHOD_COLOR[sit.method as MethodologyMethod] ?? '#66BB6A') : '#66BB6A'
            return (
              <View key={sit.id} style={[s.card, { borderLeftColor: methodColor }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <AureakText variant="body" style={{ fontWeight: '600', fontSize: 14 }}>{sit.title}</AureakText>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {sit.method && (
                        <AureakText variant="caption" style={{ color: methodColor, fontSize: 11, fontWeight: '600' }}>{sit.method}</AureakText>
                      )}
                      {sit.themeId && themeMap[sit.themeId] && (
                        <AureakText variant="caption" style={{ color: '#4FC3F7', fontSize: 10 }}>
                          🎯 {themeMap[sit.themeId]}
                        </AureakText>
                      )}
                    </View>
                    {sit.description && (
                      <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>
                        {sit.description}
                      </AureakText>
                    )}
                  </View>
                  {!sit.isActive && (
                    <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 10, fontStyle: 'italic' }}>inactif</AureakText>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      )}

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.background.primary },
  content    : { padding: space.lg, gap: space.md, maxWidth: 900, alignSelf: 'center', width: '100%' },
  header     : { gap: 4 },
  newBtn     : { backgroundColor: '#66BB6A', paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
  searchInput: {
    backgroundColor  : colors.background.elevated,
    borderWidth      : 1,
    borderColor      : colors.accent.zinc,
    borderRadius     : 8,
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    color            : colors.text.primary,
    fontSize         : 13,
  },
  chip : { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  empty: { padding: space.lg, alignItems: 'center' },
  card : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    borderLeftWidth: 3,
    padding        : space.md,
    gap            : 4,
  },
})
