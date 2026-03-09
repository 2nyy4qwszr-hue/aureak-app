'use client'
// Nouvel entraînement pédagogique — formulaire redesigné
// Titre auto-généré : {Méthode} - {Contexte} - {Ref}
// Structure : Méthode → Contexte → Module → Ref → Titre → Thèmes → Situations → Description → Médias
import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import {
  createMethodologySession,
  linkMethodologySessionTheme,
  linkMethodologySessionSituation,
  listMethodologyThemes,
  listMethodologySituations,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius, transitions, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS, METHODOLOGY_CONTEXT_TYPES,
  METHODOLOGY_CONTEXT_LABELS,
  type MethodologyMethod, type MethodologyContextType,
  type MethodologyTheme, type MethodologySituation,
} from '@aureak/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildAutoTitle(
  method     : MethodologyMethod | null,
  contextType: MethodologyContextType | null,
  trainingRef: string,
): string {
  if (!method && !contextType && !trainingRef.trim()) return ''
  const parts: string[] = []
  if (method)               parts.push(method)
  if (contextType)          parts.push(METHODOLOGY_CONTEXT_LABELS[contextType])
  if (trainingRef.trim())   parts.push(trainingRef.trim().padStart(2, '0'))
  return parts.join(' - ')
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

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
        <AureakText variant="h4" style={{ color: colors.text.dark, marginBottom: space.sm }}>
          {title}
        </AureakText>
      )}
      {children}
    </View>
  )
}

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

// ── Theme selector ────────────────────────────────────────────────────────────

type SelectedTheme = { themeId: string; sortOrder: number }

function ThemeSelector({
  themes,
  selected,
  onChange,
  loading,
}: {
  themes  : MethodologyTheme[]
  selected: SelectedTheme[]
  onChange: (sel: SelectedTheme[]) => void
  loading : boolean
}) {
  // Group themes by bloc
  const byBloc: Record<string, MethodologyTheme[]> = {}
  const noBloc: MethodologyTheme[] = []
  for (const t of themes) {
    if (t.bloc) {
      byBloc[t.bloc] = [...(byBloc[t.bloc] ?? []), t]
    } else {
      noBloc.push(t)
    }
  }

  const toggle = (themeId: string) => {
    const idx = selected.findIndex(s => s.themeId === themeId)
    if (idx >= 0) {
      // Remove and re-number
      const next = selected.filter(s => s.themeId !== themeId).map((s, i) => ({ ...s, sortOrder: i }))
      onChange(next)
    } else if (selected.length < 8) {
      onChange([...selected, { themeId, sortOrder: selected.length }])
    }
  }

  const isSelected = (id: string) => selected.some(s => s.themeId === id)
  const rank        = (id: string) => selected.findIndex(s => s.themeId === id)

  if (loading) return <ActivityIndicator color={colors.accent.gold} />

  const renderTheme = (t: MethodologyTheme) => {
    const sel = isSelected(t.id)
    const r   = rank(t.id)
    const isPrimary = r === 0
    return (
      <Pressable
        key={t.id}
        onPress={() => toggle(t.id)}
        style={{
          flexDirection  : 'row',
          alignItems     : 'center',
          gap            : 8,
          paddingVertical: 7,
          paddingHorizontal: 10,
          borderRadius   : 8,
          borderWidth    : 1,
          borderColor    : sel ? (isPrimary ? colors.accent.gold : '#4FC3F7') : colors.border.light,
          backgroundColor: sel ? (isPrimary ? colors.accent.gold + '18' : '#4FC3F7' + '18') : 'transparent',
          marginBottom   : 4,
        }}
      >
        <View style={{
          width: 20, height: 20, borderRadius: 10,
          backgroundColor: sel ? (isPrimary ? colors.accent.gold : '#4FC3F7') : colors.border.light + '40',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {sel && (
            <AureakText variant="caption" style={{ color: '#000', fontWeight: '900', fontSize: 10 }}>
              {r + 1}
            </AureakText>
          )}
        </View>
        <AureakText variant="caption" style={{ color: sel ? colors.text.dark : colors.text.muted, fontSize: 13, flex: 1 }}>
          {t.title}
        </AureakText>
        {r === 0 && (
          <View style={{ backgroundColor: colors.accent.gold + '30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
            <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 9, fontWeight: '700' }}>PRINCIPAL</AureakText>
          </View>
        )}
      </Pressable>
    )
  }

  return (
    <View style={{ gap: 12 }}>
      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
        Sélectionne 1 thème principal + jusqu'à 7 thèmes secondaires (max 8). Le premier sélectionné est le principal.
      </AureakText>
      {Object.entries(byBloc).map(([bloc, bThemes]) => (
        <View key={bloc}>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' as never, marginBottom: 6 }}>
            Bloc — {bloc}
          </AureakText>
          {bThemes.map(renderTheme)}
        </View>
      ))}
      {noBloc.length > 0 && (
        <View>
          {byBloc && Object.keys(byBloc).length > 0 && (
            <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' as never, marginBottom: 6 }}>
              Sans bloc
            </AureakText>
          )}
          {noBloc.map(renderTheme)}
        </View>
      )}
      {themes.length === 0 && (
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12 }}>
          Aucun thème actif pour cette méthode.
        </AureakText>
      )}
    </View>
  )
}

// ── Situation selector ────────────────────────────────────────────────────────

function SituationSelector({
  situations,
  selected,
  onChange,
  loading,
}: {
  situations: MethodologySituation[]
  selected  : string[]
  onChange  : (ids: string[]) => void
  loading   : boolean
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id))
    else onChange([...selected, id])
  }

  if (loading) return <ActivityIndicator color={colors.accent.gold} />

  return (
    <View style={{ gap: 4 }}>
      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginBottom: 4 }}>
        Les situations sont optionnelles. Elles complètent la séance.
      </AureakText>
      {situations.map(sit => {
        const sel = selected.includes(sit.id)
        return (
          <Pressable
            key={sit.id}
            onPress={() => toggle(sit.id)}
            style={{
              flexDirection  : 'row',
              alignItems     : 'center',
              gap            : 8,
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius   : 8,
              borderWidth    : 1,
              borderColor    : sel ? colors.accent.gold : colors.border.light,
              backgroundColor: sel ? colors.accent.gold + '15' : 'transparent',
              marginBottom   : 3,
            }}
          >
            <View style={{
              width: 16, height: 16, borderRadius: 4,
              borderWidth: 1.5,
              borderColor: sel ? colors.accent.gold : colors.border.light + '80',
              backgroundColor: sel ? colors.accent.gold : 'transparent',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {sel && <AureakText variant="caption" style={{ color: '#000', fontSize: 10, fontWeight: '900' }}>✓</AureakText>}
            </View>
            <AureakText variant="caption" style={{ color: sel ? colors.text.dark : colors.text.muted, fontSize: 13, flex: 1 }}>
              {sit.title}
            </AureakText>
          </Pressable>
        )
      })}
      {situations.length === 0 && (
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12 }}>
          Aucune situation active pour cette méthode.
        </AureakText>
      )}
    </View>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NewSeancePage() {
  const router   = useRouter()
  const tenantId = useAuthStore(s => s.tenantId) ?? ''

  // Core fields
  const [method,         setMethod]         = useState<MethodologyMethod | null>(null)
  const [contextType,    setContextType]    = useState<MethodologyContextType | null>(null)
  const [moduleName,     setModuleName]     = useState('')
  const [trainingRef,    setTrainingRef]    = useState('')
  const [titleOverride,  setTitleOverride]  = useState('')
  const [useAutoTitle,   setUseAutoTitle]   = useState(true)

  // Content
  const [description,    setDescription]   = useState('')
  const [pdfUrl,         setPdfUrl]        = useState('')
  const [videoUrl,       setVideoUrl]      = useState('')
  const [audioUrl,       setAudioUrl]      = useState('')

  // Themes & situations
  const [themes,         setThemes]        = useState<MethodologyTheme[]>([])
  const [situations,     setSituations]    = useState<MethodologySituation[]>([])
  const [loadingThemes,  setLoadingThemes] = useState(false)
  const [selectedThemes, setSelectedThemes] = useState<SelectedTheme[]>([])
  const [selectedSituations, setSelectedSituations] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  // Auto-title
  const autoTitle = buildAutoTitle(method, contextType, trainingRef)
  const finalTitle = useAutoTitle ? autoTitle : titleOverride

  // Load themes & situations when method changes
  const loadMethodData = useCallback(async (m: MethodologyMethod) => {
    setLoadingThemes(true)
    const [t, sit] = await Promise.all([
      listMethodologyThemes({ method: m }),
      listMethodologySituations({ method: m }),
    ])
    setThemes(t)
    setSituations(sit)
    setSelectedThemes([])
    setSelectedSituations([])
    setLoadingThemes(false)
  }, [])

  useEffect(() => {
    if (method) loadMethodData(method)
    else { setThemes([]); setSituations([]) }
  }, [method, loadMethodData])

  const handleSave = async () => {
    if (!finalTitle.trim()) { setError('Le titre est obligatoire.'); return }
    setSaving(true)
    setError(null)

    const { data, error: err } = await createMethodologySession({
      tenantId,
      title      : finalTitle.trim(),
      method     : method      ?? null,
      contextType: contextType ?? null,
      moduleName : moduleName.trim()  || null,
      trainingRef: trainingRef.trim() || null,
      description: description.trim() || null,
      pdfUrl     : pdfUrl.trim()    || null,
      videoUrl   : videoUrl.trim()  || null,
      audioUrl   : audioUrl.trim()  || null,
    })

    if (err || !data) {
      setSaving(false)
      setError('Erreur lors de la création.')
      return
    }

    // Link themes in order
    await Promise.all(
      selectedThemes.map(st => linkMethodologySessionTheme(data.id, st.themeId, st.sortOrder))
    )

    // Link situations in order
    await Promise.all(
      selectedSituations.map((id, i) => linkMethodologySessionSituation(data.id, id, i))
    )

    setSaving(false)
    router.replace(`/methodologie/seances/${data.id}` as never)
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── Back ── */}
      <Pressable onPress={() => router.back()}>
        <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Entraînements pédagogiques</AureakText>
      </Pressable>

      <AureakText variant="h2">Nouvel entraînement pédagogique</AureakText>

      {/* ── 1. Méthode ── */}
      <SectionCard title="1. Méthode pédagogique">
        <ChipSelect
          options={METHODOLOGY_METHODS}
          value={method}
          onSelect={v => { setMethod(v); setSelectedThemes([]); setSelectedSituations([]) }}
          color={m => methodologyMethodColors[m]}
          wrap
        />
      </SectionCard>

      {/* ── 2. Contexte ── */}
      <SectionCard title="2. Contexte d'utilisation">
        <ChipSelect
          options={METHODOLOGY_CONTEXT_TYPES}
          value={contextType}
          onSelect={setContextType}
          label={c => METHODOLOGY_CONTEXT_LABELS[c]}
        />
      </SectionCard>

      {/* ── 3. Module ── */}
      <SectionCard title="3. Module">
        <Label optional>Nom du module</Label>
        <TextInput
          style={s.input}
          value={moduleName}
          onChangeText={setModuleName}
          placeholder="Ex : Module Tir au but, Module 1vs1…"
          placeholderTextColor={colors.text.muted}
        />
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
          Hiérarchie : Méthode → Module → Entraînement
        </AureakText>
      </SectionCard>

      {/* ── 4. Référence ── */}
      <SectionCard title="4. Référence / Numéro d'entraînement">
        <Label optional>Numéro de référence</Label>
        <TextInput
          style={[s.input, { maxWidth: 120 }]}
          value={trainingRef}
          onChangeText={setTrainingRef}
          placeholder="Ex : 22, 1, 3…"
          placeholderTextColor={colors.text.muted}
          keyboardType="numeric"
        />
      </SectionCard>

      {/* ── 5. Titre ── */}
      <SectionCard title="5. Titre de la séance">
        {/* Auto-generated preview */}
        <View style={{
          backgroundColor: colors.light.muted,
          borderRadius: 8,
          padding: space.md,
          borderWidth: 1,
          borderColor: useAutoTitle ? colors.accent.gold + '60' : colors.border.light,
          marginBottom: space.sm,
        }}>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10, marginBottom: 4 }}>
            TITRE AUTO-GÉNÉRÉ
          </AureakText>
          <AureakText variant="body" style={{ color: autoTitle ? colors.text.dark : colors.text.muted, fontWeight: '600' }}>
            {autoTitle || '(complétez méthode, contexte et référence)'}
          </AureakText>
        </View>

        <Pressable
          onPress={() => setUseAutoTitle(!useAutoTitle)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: space.sm }}
        >
          <View style={{
            width: 16, height: 16, borderRadius: 4,
            borderWidth: 1.5,
            borderColor: !useAutoTitle ? colors.accent.gold : colors.border.light,
            backgroundColor: !useAutoTitle ? colors.accent.gold + '30' : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {!useAutoTitle && <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 10 }}>✓</AureakText>}
          </View>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12 }}>
            Personnaliser le titre
          </AureakText>
        </Pressable>

        {!useAutoTitle && (
          <>
            <Label>Titre personnalisé *</Label>
            <TextInput
              style={[s.input, !finalTitle.trim() && error ? s.inputError : null]}
              value={titleOverride}
              onChangeText={setTitleOverride}
              placeholder="Titre personnalisé…"
              placeholderTextColor={colors.text.muted}
            />
          </>
        )}
      </SectionCard>

      {/* ── 6. Thèmes ── */}
      <SectionCard title="6. Thèmes pédagogiques">
        {!method ? (
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12 }}>
            Sélectionnez d'abord une méthode pour voir les thèmes disponibles.
          </AureakText>
        ) : (
          <ThemeSelector
            themes={themes}
            selected={selectedThemes}
            onChange={setSelectedThemes}
            loading={loadingThemes}
          />
        )}
        {selectedThemes.length > 0 && (
          <View style={{ marginTop: space.sm, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {selectedThemes.map((st, i) => {
              const t = themes.find(th => th.id === st.themeId)
              if (!t) return null
              return (
                <View key={st.themeId} style={{
                  backgroundColor: i === 0 ? colors.accent.gold + '20' : '#4FC3F7' + '20',
                  borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
                  borderWidth: 1,
                  borderColor: i === 0 ? colors.accent.gold : '#4FC3F7',
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                }}>
                  <AureakText variant="caption" style={{ color: i === 0 ? colors.accent.gold : '#4FC3F7', fontSize: 11 }}>
                    {i + 1}. {t.title}
                  </AureakText>
                </View>
              )
            })}
          </View>
        )}
      </SectionCard>

      {/* ── 7. Situations ── */}
      <SectionCard title="7. Situations">
        {!method ? (
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12 }}>
            Sélectionnez d'abord une méthode.
          </AureakText>
        ) : (
          <SituationSelector
            situations={situations}
            selected={selectedSituations}
            onChange={setSelectedSituations}
            loading={loadingThemes}
          />
        )}
      </SectionCard>

      {/* ── 8. Description ── */}
      <SectionCard title="8. Description">
        <Label optional>Contenu / déroulé de l'entraînement</Label>
        <TextInput
          style={[s.input, s.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez le déroulé, les exercices, les consignes…"
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={5}
        />
      </SectionCard>

      {/* ── 9. Médias ── */}
      <SectionCard title="9. Médias">
        <Label optional>URL du PDF</Label>
        <TextInput
          style={s.input}
          value={pdfUrl}
          onChangeText={setPdfUrl}
          placeholder="https://…/séance.pdf"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Label optional>URL Vidéo</Label>
        <TextInput
          style={s.input}
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="https://…/séance.mp4 ou lien YouTube"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Label optional>URL Audio</Label>
        <TextInput
          style={s.input}
          value={audioUrl}
          onChangeText={setAudioUrl}
          placeholder="https://…/séance.mp3"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          keyboardType="url"
        />

        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
          Collez des URLs hébergées (Supabase Storage, Drive, YouTube, etc.)
        </AureakText>
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
          style={[s.saveBtn, (!finalTitle.trim() || saving) && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!finalTitle.trim() || saving}
        >
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            {saving ? 'Création…' : "Créer l'entraînement"}
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
  textarea  : { minHeight: 100, textAlignVertical: 'top' as never, paddingTop: 10 },
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
