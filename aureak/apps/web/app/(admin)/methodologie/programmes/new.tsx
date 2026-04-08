'use client'
// Nouveau programme pédagogique — formulaire création
// Story 34.5 — context_type = 'academie' uniquement dans cette story
import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import {
  createMethodologyProgramme,
  listAcademySeasons,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS,
  type MethodologyMethod,
} from '@aureak/types'
import type { AcademySeason } from '@aureak/types'

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function Label({ children, optional }: { children: string; optional?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6 }}>
      <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700', letterSpacing: 0.8, fontSize: 10, textTransform: 'uppercase' as never }}>
        {children}
      </AureakText>
      {optional && (
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 9, opacity: 0.6 }}>
          (optionnel)
        </AureakText>
      )}
    </View>
  )
}

function SectionCard({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <View style={s.section}>
      {title && (
        <AureakText variant="h3" style={{ color: colors.text.dark, marginBottom: space.sm }}>
          {title}
        </AureakText>
      )}
      {children}
    </View>
  )
}

// ── Chip selector générique ───────────────────────────────────────────────────

function ChipSelect<T extends string>({
  options, value, onSelect, label, color, wrap,
}: {
  options : T[]
  value   : T | null
  onSelect: (v: T | null) => void
  label?  : (v: T) => string
  color?  : (v: T) => string
  wrap?   : boolean
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', gap: 6 }}>
      {options.map(opt => {
        const active = value === opt
        const c      = color ? color(opt) : colors.accent.gold
        return (
          <Pressable
            key={opt}
            onPress={() => onSelect(active ? null : opt)}
            style={{
              borderWidth      : 1,
              borderColor      : active ? c : colors.border.light,
              borderRadius     : 20,
              paddingHorizontal: 12,
              paddingVertical  : 5,
              backgroundColor  : active ? c + '20' : 'transparent',
            }}
          >
            <AureakText variant="caption" style={{ color: active ? c : colors.text.muted, fontWeight: active ? '700' : '400', fontSize: 12 }}>
              {label ? label(opt) : opt}
            </AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NewProgrammePage() {
  const router   = useRouter()
  const tenantId = useAuthStore(s => s.tenantId) ?? ''

  const [method,      setMethod]      = useState<MethodologyMethod | null>(null)
  const [seasonId,    setSeasonId]    = useState<string | null>(null)
  const [total,       setTotal]       = useState('10')
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')

  const [seasons,        setSeasons]        = useState<AcademySeason[]>([])
  const [loadingSeasons, setLoadingSeasons] = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  const loadSeasons = useCallback(async () => {
    setLoadingSeasons(true)
    try {
      const { data } = await listAcademySeasons()
      setSeasons(data ?? [])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[new-programme] load seasons error:', err)
    } finally {
      setLoadingSeasons(false)
    }
  }, [])

  useEffect(() => { loadSeasons() }, [loadSeasons])

  const canSubmit = !!method && title.trim().length > 0 && !saving

  const handleSave = async () => {
    if (!method)            { setError('La méthode est obligatoire.'); return }
    if (!title.trim())      { setError('Le titre est obligatoire.'); return }
    const totalNum = parseInt(total, 10)
    if (isNaN(totalNum) || totalNum < 1) { setError('Le total prévu doit être un nombre positif.'); return }

    setSaving(true)
    setError(null)
    try {
      const { data, error: err } = await createMethodologyProgramme({
        tenantId,
        method,
        contextType  : 'academie',
        title        : title.trim(),
        seasonId     : seasonId ?? null,
        totalSessions: totalNum,
        description  : description.trim() || null,
      })

      if (err || !data) {
        setError('Erreur lors de la création.')
        return
      }

      router.replace(`/methodologie/programmes/${data.id}` as never)
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.error('[new-programme] handleSave error:', e)
      setError('Erreur inattendue lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── Back ── */}
      <Pressable onPress={() => router.back()}>
        <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Programmes</AureakText>
      </Pressable>

      <AureakText variant="h2" style={{ color: colors.text.dark }}>Nouveau programme</AureakText>

      {/* ── 1. Méthode ── */}
      <SectionCard title="1. Méthode pédagogique *">
        <ChipSelect
          options={METHODOLOGY_METHODS}
          value={method}
          onSelect={v => setMethod(v)}
          color={m => methodologyMethodColors[m]}
          wrap
        />
      </SectionCard>

      {/* ── 2. Contexte ── (fixe : académie) */}
      <SectionCard title="2. Contexte">
        <View style={{
          backgroundColor: colors.accent.gold + '18',
          borderRadius   : 20,
          borderWidth    : 1,
          borderColor    : colors.accent.gold,
          paddingHorizontal: 16,
          paddingVertical  : 7,
          alignSelf: 'flex-start',
        }}>
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 12 }}>
            Académie
          </AureakText>
        </View>
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginTop: 6 }}>
          Le contexte "Stage" sera disponible dans une prochaine version.
        </AureakText>
      </SectionCard>

      {/* ── 3. Saison ── */}
      <SectionCard title="3. Saison">
        {loadingSeasons ? (
          <ActivityIndicator color={colors.accent.gold} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Pressable
              onPress={() => setSeasonId(null)}
              style={{
                borderWidth      : 1,
                borderColor      : seasonId === null ? colors.accent.gold : colors.border.light,
                borderRadius     : 20,
                paddingHorizontal: 12,
                paddingVertical  : 5,
                backgroundColor  : seasonId === null ? colors.accent.gold + '20' : 'transparent',
              }}
            >
              <AureakText variant="caption" style={{ color: seasonId === null ? colors.accent.gold : colors.text.muted, fontWeight: seasonId === null ? '700' : '400', fontSize: 12 }}>
                Aucune
              </AureakText>
            </Pressable>
            {seasons.map(season => (
              <Pressable
                key={season.id}
                onPress={() => setSeasonId(season.id)}
                style={{
                  borderWidth      : 1,
                  borderColor      : seasonId === season.id ? colors.accent.gold : colors.border.light,
                  borderRadius     : 20,
                  paddingHorizontal: 12,
                  paddingVertical  : 5,
                  backgroundColor  : seasonId === season.id ? colors.accent.gold + '20' : 'transparent',
                }}
              >
                <AureakText variant="caption" style={{ color: seasonId === season.id ? colors.accent.gold : colors.text.muted, fontWeight: seasonId === season.id ? '700' : '400', fontSize: 12 }}>
                  {season.label}
                </AureakText>
              </Pressable>
            ))}
          </View>
        )}
      </SectionCard>

      {/* ── 4. Total prévu ── */}
      <SectionCard title="4. Total d'entraînements prévus *">
        <TextInput
          style={[s.input, { maxWidth: 120 }]}
          value={total}
          onChangeText={setTotal}
          placeholder="Ex : 10"
          placeholderTextColor={colors.text.muted}
          keyboardType="numeric"
        />
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
          Objectif indicatif — nombre d'entraînements prévus dans ce programme.
        </AureakText>
      </SectionCard>

      {/* ── 5. Titre ── */}
      <SectionCard title="5. Titre *">
        <Label>Intitulé du programme</Label>
        <TextInput
          style={[s.input, !title.trim() && error ? s.inputError : null]}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex : Programme Technique Académie 2025-2026…"
          placeholderTextColor={colors.text.muted}
        />
      </SectionCard>

      {/* ── 6. Description ── */}
      <SectionCard title="6. Description">
        <Label optional>Présentation du programme</Label>
        <TextInput
          style={[s.input, s.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez les objectifs, la progression, le public cible…"
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={4}
        />
      </SectionCard>

      {/* ── Error ── */}
      {error && (
        <AureakText variant="caption" style={{ color: colors.status.attention, fontSize: 12 }}>{error}</AureakText>
      )}

      {/* ── Actions ── */}
      <View style={s.actions}>
        <Pressable style={s.cancelBtn} onPress={() => router.back()}>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
        </Pressable>
        <Pressable
          style={[s.saveBtn, !canSubmit && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!canSubmit}
        >
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            {saving ? 'Création…' : 'Créer le programme'}
          </AureakText>
        </Pressable>
      </View>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.lg, gap: space.md, maxWidth: 740, alignSelf: 'center', width: '100%' },
  section   : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    gap            : space.sm,
  },
  input: {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 8,
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    color            : colors.text.dark,
    fontSize         : 13,
  },
  inputError: { borderColor: colors.status.attention },
  textarea  : { minHeight: 90, textAlignVertical: 'top' as never, paddingTop: 10 },
  actions   : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', paddingBottom: space.xl },
  cancelBtn : {
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    borderRadius     : 8,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  saveBtn: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.lg,
    paddingVertical  : 10,
    borderRadius     : 8,
  },
})
