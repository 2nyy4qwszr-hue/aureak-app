'use client'
// Thèmes pédagogiques — blocs de savoir coach
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologyThemes } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius, transitions, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS,
  type MethodologyMethod,
} from '@aureak/types'
import type { MethodologyTheme } from '@aureak/types'

type FilterMethod = MethodologyMethod | 'all'

export default function ThemesPage() {
  const router = useRouter()

  const [themes,       setThemes]       = useState<MethodologyTheme[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [methodFilter, setMethodFilter] = useState<FilterMethod>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await listMethodologyThemes({ activeOnly: false })
    setThemes(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = themes.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (methodFilter !== 'all' && t.method !== methodFilter) return false
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
            <AureakText variant="h2" color={colors.accent.gold}>Thèmes</AureakText>
            {!loading && (
              <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
                {filtered.length} thème{filtered.length !== 1 ? 's' : ''}
              </AureakText>
            )}
          </View>
          <Pressable style={s.newBtn} onPress={() => router.push('/methodologie/themes/new' as never)}>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>+ Nouveau thème</AureakText>
          </Pressable>
        </View>
      </View>

      {/* ── Search ── */}
      <TextInput
        style={s.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher par titre…"
        placeholderTextColor={colors.text.muted}
      />

      {/* ── Method filter ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['all', ...METHODOLOGY_METHODS] as FilterMethod[]).map(m => {
            const active = methodFilter === m
            return (
              <Pressable
                key={m}
                onPress={() => setMethodFilter(m)}
                style={[s.chip, { borderColor: active ? colors.accent.gold : colors.border.light, backgroundColor: active ? colors.accent.gold + '18' : 'transparent' }]}
              >
                <AureakText variant="caption" style={{ color: active ? colors.text.dark : colors.text.muted, fontWeight: active ? '700' : '400', fontSize: 12 }}>
                  {m === 'all' ? 'Toutes méthodes' : m}
                </AureakText>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>

      {/* ── List ── */}
      {loading ? (
        <AureakText variant="caption" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' }}>
            {themes.length === 0 ? 'Aucun thème. Créez le premier.' : 'Aucun résultat pour ces filtres.'}
          </AureakText>
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          {filtered.map(theme => {
            const methodColor = theme.method ? (methodologyMethodColors[theme.method as MethodologyMethod] ?? colors.border.light) : colors.border.light
            return (
              <View key={theme.id} style={[s.card, { borderLeftColor: methodColor }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <AureakText variant="body" style={{ fontWeight: '600', fontSize: 14 }}>{theme.title}</AureakText>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {theme.method && (
                        <AureakText variant="caption" style={{ color: methodColor, fontSize: 11, fontWeight: '600' }}>{theme.method}</AureakText>
                      )}
                      {theme.bloc && (
                        <View style={{ backgroundColor: colors.light.muted, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>Bloc : {theme.bloc}</AureakText>
                        </View>
                      )}
                    </View>
                    {theme.description && (
                      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>
                        {theme.description}
                      </AureakText>
                    )}
                  </View>
                  <View style={{ gap: 4, alignItems: 'flex-end' }}>
                    {!theme.isActive && (
                      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10, fontStyle: 'italic' }}>inactif</AureakText>
                    )}
                  </View>
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
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.lg, gap: space.md, maxWidth: 900, alignSelf: 'center', width: '100%' },
  header     : { gap: 4 },
  newBtn     : { backgroundColor: '#4FC3F7', paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
  searchInput: {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 8,
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    color            : colors.text.dark,
    fontSize         : 13,
  },
  chip : { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  empty: { padding: space.lg, alignItems: 'center' },
  card : {
    backgroundColor : colors.light.surface,
    borderRadius    : 10,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    borderLeftWidth : 3,
    padding         : space.md,
    gap             : 4,
  },
})
