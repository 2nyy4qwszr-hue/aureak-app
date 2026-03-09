'use client'
// Entraînements pédagogiques — bibliothèque de contenu réutilisable
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologySessions } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius, transitions, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS, METHODOLOGY_CONTEXT_TYPES,
  METHODOLOGY_CONTEXT_LABELS, METHODOLOGY_LEVEL_LABELS,
  type MethodologyMethod, type MethodologyContextType, type MethodologyLevel,
} from '@aureak/types'
import type { MethodologySession } from '@aureak/types'

type FilterMethod  = MethodologyMethod | 'all'
type FilterContext = MethodologyContextType | 'all'

function MethodBadge({ method }: { method: string | null }) {
  if (!method) return null
  const color = methodologyMethodColors[method as MethodologyMethod] ?? colors.border.light
  return (
    <View style={{ backgroundColor: color + '18', borderColor: color, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
      <AureakText variant="caption" style={{ color, fontWeight: '700', fontSize: 10 }}>{method}</AureakText>
    </View>
  )
}

function ContextBadge({ contextType }: { contextType: string | null }) {
  if (!contextType) return null
  const label = METHODOLOGY_CONTEXT_LABELS[contextType as MethodologyContextType] ?? contextType
  return (
    <View style={{ backgroundColor: colors.light.muted, borderColor: colors.border.light, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>{label}</AureakText>
    </View>
  )
}

function LevelDot({ level }: { level: string | null }) {
  if (!level) return null
  const label = METHODOLOGY_LEVEL_LABELS[level as MethodologyLevel] ?? level
  const color = level === 'avance' ? '#F97316' : level === 'intermediaire' ? '#4FC3F7' : '#66BB6A'
  return (
    <AureakText variant="caption" style={{ color, fontSize: 10, fontWeight: '600' }}>{label}</AureakText>
  )
}

export default function SeancesPage() {
  const router = useRouter()

  const [sessions,       setSessions]       = useState<MethodologySession[]>([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [methodFilter,   setMethodFilter]   = useState<FilterMethod>('all')
  const [contextFilter,  setContextFilter]  = useState<FilterContext>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await listMethodologySessions({ activeOnly: false })
    setSessions(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = sessions.filter(s => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    if (methodFilter  !== 'all' && s.method      !== methodFilter)  return false
    if (contextFilter !== 'all' && s.contextType !== contextFilter) return false
    return true
  })

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <AureakText variant="h2" color={colors.accent.gold}>Entraînements pédagogiques</AureakText>
            {!loading && (
              <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
                {filtered.length} entraînement{filtered.length !== 1 ? 's' : ''}
              </AureakText>
            )}
          </View>
          <Pressable style={s.newBtn} onPress={() => router.push('/methodologie/seances/new' as never)}>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>+ Nouvel entraînement</AureakText>
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

      {/* ── Filters ── */}
      <View style={s.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {/* Method filter */}
            {(['all', ...METHODOLOGY_METHODS] as (FilterMethod)[]).map(m => {
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
      </View>

      <View style={s.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['all', ...METHODOLOGY_CONTEXT_TYPES] as (FilterContext)[]).map(c => {
              const active = contextFilter === c
              return (
                <Pressable
                  key={c}
                  onPress={() => setContextFilter(c)}
                  style={[s.chip, { borderColor: active ? colors.accent.gold : colors.border.light, backgroundColor: active ? colors.accent.gold + '18' : 'transparent' }]}
                >
                  <AureakText variant="caption" style={{ color: active ? colors.text.dark : colors.text.muted, fontWeight: active ? '700' : '400', fontSize: 12 }}>
                    {c === 'all' ? 'Tous contextes' : METHODOLOGY_CONTEXT_LABELS[c as MethodologyContextType]}
                  </AureakText>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </View>

      {/* ── List ── */}
      {loading ? (
        <AureakText variant="caption" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' }}>
            {sessions.length === 0 ? 'Aucun entraînement pédagogique. Créez le premier.' : 'Aucun résultat pour ces filtres.'}
          </AureakText>
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          {filtered.map(session => (
            <Pressable
              key={session.id}
              style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.light.muted }]}
              onPress={() => router.push(`/methodologie/seances/${session.id}` as never)}
            >
              {/* Active indicator */}
              <View style={[s.activeDot, { backgroundColor: session.isActive ? '#66BB6A' : colors.border.light }]} />

              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <AureakText variant="body" style={{ fontWeight: '600', fontSize: 14 }}>{session.title}</AureakText>
                  {session.trainingRef && (
                    <View style={{ backgroundColor: colors.accent.gold + '18', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 10, fontWeight: '700' }}>#{session.trainingRef}</AureakText>
                    </View>
                  )}
                  {!session.isActive && (
                    <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10, fontStyle: 'italic' }}>inactif</AureakText>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <MethodBadge method={session.method} />
                  <ContextBadge contextType={session.contextType} />
                  {session.moduleName && (
                    <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>{session.moduleName}</AureakText>
                  )}
                </View>

                {session.description && (
                  <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12 }} numberOfLines={1}>
                    {session.description}
                  </AureakText>
                )}
              </View>

              {/* Media indicators */}
              <View style={{ gap: 3, alignItems: 'flex-end' }}>
                {session.pdfUrl && (
                  <View style={s.pdfBadge}>
                    <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 10, fontWeight: '700' }}>PDF</AureakText>
                  </View>
                )}
                {session.videoUrl && (
                  <View style={[s.pdfBadge, { borderColor: '#4FC3F7' + '50', backgroundColor: '#4FC3F7' + '18' }]}>
                    <AureakText variant="caption" style={{ color: '#4FC3F7', fontSize: 10, fontWeight: '700' }}>VID</AureakText>
                  </View>
                )}
                {session.audioUrl && (
                  <View style={[s.pdfBadge, { borderColor: '#CE93D8' + '50', backgroundColor: '#CE93D8' + '18' }]}>
                    <AureakText variant="caption" style={{ color: '#CE93D8', fontSize: 10, fontWeight: '700' }}>AUDIO</AureakText>
                  </View>
                )}
              </View>

              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 16 }}>›</AureakText>
            </Pressable>
          ))}
        </View>
      )}

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.lg, gap: space.md, maxWidth: 900, alignSelf: 'center', width: '100%' },
  header     : { gap: 4 },
  newBtn     : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
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
  filterRow: { flexDirection: 'row' },
  chip     : { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  empty    : { padding: space.lg, alignItems: 'center' },
  row      : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : 12,
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  pdfBadge : {
    backgroundColor : colors.accent.gold + '18',
    borderWidth     : 1,
    borderColor     : colors.accent.gold + '50',
    borderRadius    : 6,
    paddingHorizontal: 7,
    paddingVertical : 3,
  },
})
