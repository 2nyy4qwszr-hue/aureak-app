'use client'
// Nouveau programme pédagogique — formulaire intelligent
// Story 34.5 — création de base
// Story 34.1 — tuiles méthode, auto-titre, total pré-rempli, preview card
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import {
  createMethodologyProgramme,
  listAcademySeasons,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS,
  type MethodologyMethod,
} from '@aureak/types'
import type { AcademySeason } from '@aureak/types'

// ── Constantes méthode ────────────────────────────────────────────────────────

const METHOD_PICTOS: Record<MethodologyMethod, string> = {
  'Goal and Player' : '⚽',
  'Technique'       : '📚',
  'Situationnel'    : '📐',
  'Perfectionnement': '🎯',
  'Performance'     : '💪',
  'Décisionnel'     : '🧠',
  'Intégration'     : '👥',
}

const METHOD_DESCRIPTIONS: Record<MethodologyMethod, string> = {
  'Goal and Player' : 'Travail combiné gardien + joueur de champ',
  'Technique'       : 'Fondamentaux techniques du gardien de but',
  'Situationnel'    : 'Situations de jeu réelles et contextuelles',
  'Perfectionnement': 'Affinement des habiletés avancées',
  'Performance'     : 'Préparation physique et mentale',
  'Décisionnel'     : 'Prise de décision sous pression',
  'Intégration'     : 'Intégration et travail collectif',
}

const METHOD_DEFAULT_TOTAL: Record<MethodologyMethod, number> = {
  'Goal and Player' : 12,
  'Technique'       : 20,
  'Situationnel'    : 15,
  'Perfectionnement': 10,
  'Performance'     : 8,
  'Décisionnel'     : 12,
  'Intégration'     : 10,
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function Label({ children, optional, required }: { children: string; optional?: boolean; required?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6 }}>
      <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700', letterSpacing: 0.8, fontSize: 10, textTransform: 'uppercase' as never }}>
        {children}
      </AureakText>
      {required && (
        <AureakText variant="caption" style={{ color: colors.status.attention, fontSize: 12, fontWeight: '700' }}>*</AureakText>
      )}
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

function FieldError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <AureakText variant="caption" style={{ color: colors.status.attention, fontSize: 11, marginTop: 4 }}>
      {message}
    </AureakText>
  )
}

// ── Method Tile Grid (Story 34.1) ─────────────────────────────────────────────

function MethodTileGrid({
  value, onChange,
}: {
  value   : MethodologyMethod | null
  onChange: (m: MethodologyMethod) => void
}) {
  return (
    <View style={mtg.grid}>
      {METHODOLOGY_METHODS.map(m => {
        const isActive = value === m
        const color    = methodologyMethodColors[m] ?? colors.accent.gold
        const icon     = METHOD_PICTOS[m] ?? '📋'
        const desc     = METHOD_DESCRIPTIONS[m] ?? ''

        return (
          <Pressable
            key={m}
            style={[
              mtg.tile,
              isActive
                ? { backgroundColor: color + '25', borderColor: color, borderWidth: 2 }
                : { backgroundColor: colors.light.surface, borderColor: colors.border.light, borderWidth: 1 },
            ]}
            onPress={() => onChange(m)}
          >
            {isActive && (
              <View style={[mtg.checkmark, { backgroundColor: color }]}>
                <AureakText style={{ fontSize: 9, color: '#fff', fontWeight: '700' as never }}>✓</AureakText>
              </View>
            )}
            <AureakText style={{ fontSize: 22 }}>{icon}</AureakText>
            <AureakText style={[mtg.tileLabel, { color: isActive ? color : colors.text.dark }] as never}>
              {m}
            </AureakText>
            <AureakText style={mtg.tileDesc} numberOfLines={2}>{desc}</AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

const mtg = StyleSheet.create({
  grid     : { flexDirection: 'row', flexWrap: 'wrap' as never, gap: space.sm },
  tile     : {
    width        : '31%' as never,
    minWidth     : 140,
    flexGrow     : 1,
    borderRadius : radius.xs,
    padding      : space.md,
    gap          : 4,
    position     : 'relative' as never,
  },
  tileLabel: { fontSize: 12, fontWeight: '700' as never },
  tileDesc : { fontSize: 10, color: colors.text.muted, lineHeight: 14 },
  checkmark: {
    position     : 'absolute' as never,
    top          : 8,
    right        : 8,
    width        : 18,
    height       : 18,
    borderRadius : 9,
    alignItems   : 'center' as never,
    justifyContent: 'center' as never,
  },
})

// ── Preview Card (Story 34.1) ─────────────────────────────────────────────────

function PreviewCard({
  method, title, seasonLabel, total,
}: {
  method      : MethodologyMethod | null
  title       : string
  seasonLabel : string | null
  total       : string
}) {
  const color = method ? (methodologyMethodColors[method] ?? colors.accent.gold) : colors.text.muted

  return (
    <View style={pv.card}>
      <AureakText variant="caption" style={pv.previewLabel as TextStyle}>APERCU DU PROGRAMME</AureakText>
      <View style={pv.row}>
        <View style={[pv.methodCircle, { backgroundColor: color + '30', borderColor: color }]}>
          <AureakText style={{ fontSize: 20 }}>{method ? METHOD_PICTOS[method] : '?'}</AureakText>
        </View>
        <View style={pv.info}>
          <AureakText variant="body" style={pv.title as TextStyle} numberOfLines={2}>
            {title || 'Titre du programme'}
          </AureakText>
          <View style={pv.meta}>
            {method && (
              <AureakText variant="caption" style={[pv.badge, { color, borderColor: color }] as never}>
                {method}
              </AureakText>
            )}
            {seasonLabel && (
              <AureakText variant="caption" style={pv.season}>{seasonLabel}</AureakText>
            )}
            <AureakText variant="caption" style={pv.totalLabel}>
              {total || '0'} entr. prevus
            </AureakText>
          </View>
        </View>
      </View>
    </View>
  )
}

const pv = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    padding        : space.md,
    gap            : space.sm,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  previewLabel: {
    fontSize     : 9,
    fontWeight   : '700',
    letterSpacing: 1.2,
    color        : colors.text.muted,
    textTransform: 'uppercase' as never,
  },
  row: {
    flexDirection: 'row',
    gap          : space.md,
    alignItems   : 'center',
  },
  methodCircle: {
    width         : 48,
    height        : 48,
    borderRadius  : 24,
    borderWidth   : 2,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 4 },
  title: {
    fontSize  : 15,
    fontWeight : '700',
    fontFamily : fonts.display,
    color      : colors.text.dark,
  },
  meta: {
    flexDirection: 'row',
    gap          : space.xs,
    alignItems   : 'center',
    flexWrap     : 'wrap' as never,
  },
  badge: {
    fontSize        : 10,
    fontWeight      : '600',
    borderWidth     : 1,
    borderRadius    : 12,
    paddingHorizontal: 8,
    paddingVertical : 2,
  },
  season: { fontSize: 11, color: colors.text.muted },
  totalLabel: { fontSize: 11, color: colors.text.subtle },
})

// ── Main component ────────────────────────────────────────────────────────────

export default function NewProgrammePage() {
  const router   = useRouter()
  const tenantId = useAuthStore(s => s.tenantId) ?? ''

  const [method,        setMethod]        = useState<MethodologyMethod | null>(null)
  const [seasonId,      setSeasonId]      = useState<string | null>(null)
  const [total,         setTotal]         = useState('10')
  const [title,         setTitle]         = useState('')
  const [titleTouched,  setTitleTouched]  = useState(false)
  const [description,   setDescription]   = useState('')

  const [seasons,        setSeasons]        = useState<AcademySeason[]>([])
  const [loadingSeasons, setLoadingSeasons] = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [fieldErrors,    setFieldErrors]    = useState<Record<string, string | null>>({})

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

  // ── Story 34.1 — Auto-titre intelligent ──
  const selectedSeason = useMemo(
    () => seasons.find(s => s.id === seasonId) ?? null,
    [seasons, seasonId]
  )

  const autoTitle = useMemo(() => {
    if (!method) return ''
    const parts = ['Programme', method, 'Academie']
    if (selectedSeason) parts.push(selectedSeason.label)
    return parts.join(' ')
  }, [method, selectedSeason])

  // Quand la méthode ou la saison changent, si le titre n'a pas été touché manuellement, auto-fill
  useEffect(() => {
    if (!titleTouched && autoTitle) {
      setTitle(autoTitle)
    }
  }, [autoTitle, titleTouched])

  // ── Story 34.1 — Total pré-rempli par méthode ──
  const handleMethodChange = useCallback((m: MethodologyMethod) => {
    setMethod(m)
    // Pré-remplir le total si l'utilisateur n'a pas modifié manuellement
    const defaultTotal = METHOD_DEFAULT_TOTAL[m]
    if (defaultTotal) setTotal(String(defaultTotal))
    // Clear method error
    setFieldErrors(prev => ({ ...prev, method: null }))
  }, [])

  const handleTitleChange = useCallback((v: string) => {
    setTitle(v)
    setTitleTouched(true)
    setFieldErrors(prev => ({ ...prev, title: null }))
  }, [])

  const canSubmit = !!method && title.trim().length > 0 && !saving

  const handleSave = async () => {
    const errors: Record<string, string | null> = {}
    if (!method)            errors.method = 'Selectionnez une methode pedagogique.'
    if (!title.trim())      errors.title  = 'Le titre est obligatoire.'
    const totalNum = parseInt(total, 10)
    if (isNaN(totalNum) || totalNum < 1) errors.total = 'Le total doit etre un nombre positif.'

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors)
      return
    }

    setSaving(true)
    setFieldErrors({})
    try {
      const { data, error: err } = await createMethodologyProgramme({
        tenantId,
        method: method!,
        contextType  : 'academie',
        title        : title.trim(),
        seasonId     : seasonId ?? null,
        totalSessions: totalNum,
        description  : description.trim() || null,
      })

      if (err || !data) {
        setFieldErrors({ _global: 'Erreur lors de la creation.' })
        return
      }

      router.replace(`/methodologie/programmes/${data.id}` as never)
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.error('[new-programme] handleSave error:', e)
      setFieldErrors({ _global: 'Erreur inattendue lors de la creation.' })
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

      {/* ── Layout formulaire + preview ── */}
      <View style={s.formRow}>
        {/* ── Colonne formulaire ── */}
        <View style={s.formCol}>

          {/* ── 1. Méthode — Tuiles visuelles (Story 34.1) ── */}
          <SectionCard title="1. Methode pedagogique *">
            <MethodTileGrid value={method} onChange={handleMethodChange} />
            <FieldError message={fieldErrors.method ?? null} />
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
                Academie
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
          <SectionCard title="4. Total d'entrainements prevus *">
            <TextInput
              style={[s.input, { maxWidth: 120 }, fieldErrors.total ? s.inputError : null]}
              value={total}
              onChangeText={v => { setTotal(v); setFieldErrors(prev => ({ ...prev, total: null })) }}
              placeholder="Ex : 10"
              placeholderTextColor={colors.text.muted}
              keyboardType="numeric"
            />
            {method && (
              <AureakText variant="caption" style={{ color: colors.text.subtle, fontSize: 11 }}>
                Suggestion : {METHOD_DEFAULT_TOTAL[method]} entrainements pour {method}.
              </AureakText>
            )}
            <FieldError message={fieldErrors.total ?? null} />
          </SectionCard>

          {/* ── 5. Titre ── */}
          <SectionCard title="5. Titre *">
            <Label required>Intitule du programme</Label>
            <TextInput
              style={[s.input, fieldErrors.title ? s.inputError : null]}
              value={title}
              onChangeText={handleTitleChange}
              placeholder="Ex : Programme Technique Academie 2025-2026…"
              placeholderTextColor={colors.text.muted}
            />
            {!titleTouched && autoTitle ? (
              <AureakText variant="caption" style={{ color: colors.text.subtle, fontSize: 11 }}>
                Titre auto-genere. Modifiez-le librement.
              </AureakText>
            ) : null}
            <FieldError message={fieldErrors.title ?? null} />
          </SectionCard>

          {/* ── 6. Description ── */}
          <SectionCard title="6. Description">
            <Label optional>Presentation du programme</Label>
            <TextInput
              style={[s.input, s.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Decrivez les objectifs, la progression, le public cible…"
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={4}
            />
          </SectionCard>
        </View>

        {/* ── Colonne preview (Story 34.1) ── */}
        <View style={s.previewCol}>
          <PreviewCard
            method={method}
            title={title}
            seasonLabel={selectedSeason?.label ?? null}
            total={total}
          />
        </View>
      </View>

      {/* ── Error global ── */}
      {fieldErrors._global && (
        <AureakText variant="caption" style={{ color: colors.status.attention, fontSize: 12 }}>{fieldErrors._global}</AureakText>
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
            {saving ? 'Creation…' : 'Creer le programme'}
          </AureakText>
        </Pressable>
      </View>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.lg, gap: space.md, maxWidth: 960, alignSelf: 'center', width: '100%' },
  formRow   : { flexDirection: 'row', gap: space.lg, alignItems: 'flex-start' },
  formCol   : { flex: 1, gap: space.md },
  previewCol: { width: 280, position: 'sticky' as never, top: space.lg },
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
