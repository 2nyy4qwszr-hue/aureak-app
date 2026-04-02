'use client'
// /methodologie/programmes/[programmeId] — Détail programme (Story 34.1 + 34.2)

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { View, Pressable, ActivityIndicator, StyleSheet, TextInput, ScrollView } from 'react-native'
import { Text } from 'tamagui'
import {
  getProgramme, listTrainingsByProgramme, createTraining,
  getModuleConfig, getUsedTrainingNumbers, listModuleConfigs,
  getProgrammeOverview, getMethodProgress,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS, SITUATIONNEL_BLOCS, METHODS_WITH_MODULES,
  METHODS_WITH_BLOCS, METHODS_FREE, TRAINING_TYPE_LABELS,
} from '@aureak/types'
import type { MethodStat, ModuleStat } from '@aureak/api-client'
import type { Programme, MethodologySession, MethodModuleConfig } from '@aureak/types'
import type { MethodologyMethod, TrainingType } from '@aureak/types'

const MODULE_COUNTS: Record<string, number> = {
  'Goal and Player': 3,
  'Technique'      : 8,
}

export default function ProgrammeDetailPage() {
  const router                                = useRouter()
  const { programmeId }                       = useLocalSearchParams<{ programmeId: string }>()
  const { user }                              = useAuthStore()
  const tenantId                              = (user?.app_metadata?.tenant_id as string | undefined) ?? ''

  const [programme, setProgramme]             = useState<Programme | null>(null)
  const [trainings, setTrainings]             = useState<MethodologySession[]>([])
  const [moduleConfigs, setModuleConfigs]     = useState<MethodModuleConfig[]>([])
  const [loading, setLoading]                 = useState(true)
  const [selectedMethod, setSelectedMethod]   = useState<MethodologyMethod | null>(null)
  const [selectedUnit, setSelectedUnit]       = useState<number | string | null>(null)
  const [showForm, setShowForm]               = useState(false)

  const load = useCallback(async () => {
    if (!programmeId) return
    setLoading(true)
    try {
      const [prog, list, cfgs] = await Promise.all([
        getProgramme(programmeId),
        listTrainingsByProgramme(programmeId),
        listModuleConfigs(),
      ])
      setProgramme(prog)
      setTrainings(list)
      setModuleConfigs(cfgs)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProgrammeDetail] load:', err)
    } finally {
      setLoading(false)
    }
  }, [programmeId])

  useEffect(() => { load() }, [load])

  const overview: MethodStat[] = useMemo(
    () => getProgrammeOverview(trainings),
    [trainings],
  )

  const unitProgress: ModuleStat[] = useMemo(() => {
    if (!selectedMethod) return []
    return getMethodProgress(trainings, selectedMethod, moduleConfigs)
  }, [trainings, selectedMethod, moduleConfigs])

  const displayedTrainings = useMemo(() => {
    if (!selectedMethod) return trainings
    const byMethod = trainings.filter((t) => t.method === selectedMethod)
    if (selectedUnit == null) return byMethod
    if (typeof selectedUnit === 'number') return byMethod.filter((t) => t.moduleNumber === selectedUnit)
    if (selectedUnit === 'all')           return byMethod
    return byMethod.filter((t) => t.blocName === selectedUnit)
  }, [trainings, selectedMethod, selectedUnit])

  function selectMethod(m: MethodologyMethod) {
    if (selectedMethod === m) {
      setSelectedMethod(null)
      setSelectedUnit(null)
    } else {
      setSelectedMethod(m)
      setSelectedUnit(null)
    }
    setShowForm(false)
  }

  function selectUnit(u: number | string) {
    setSelectedUnit(selectedUnit === u ? null : u)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    )
  }

  if (!programme) {
    return (
      <View style={styles.center}>
        <Text color={colors.text.muted}>Programme introuvable.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text color={colors.accent.gold}>← Retour</Text>
        </Pressable>
      </View>
    )
  }

  const isAcademie         = programme.programmeType === 'academie'
  const methodHasUnits     = selectedMethod
    ? (METHODS_WITH_MODULES.includes(selectedMethod) || METHODS_WITH_BLOCS.includes(selectedMethod))
    : false

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.light.primary }}>
      <View style={styles.page}>
        <Pressable onPress={() => router.push('/methodologie/programmes' as never)} style={{ marginBottom: 12 }}>
          <Text color={colors.text.muted} fontSize={14}>← Programmes</Text>
        </Pressable>

        {/* ── Programme header ───────────────────────────────────────────── */}
        <View style={[styles.card, { borderColor: isAcademie ? colors.border.gold : colors.border.light }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <View style={[styles.badge, { backgroundColor: isAcademie ? colors.accent.gold : colors.light.elevated }]}>
                  <Text fontSize={11} fontWeight="600" color={isAcademie ? '#000' : colors.text.muted}>
                    {isAcademie ? 'Académie' : 'Stage'}
                  </Text>
                </View>
                {programme.theme ? <Text fontSize={12} color={colors.text.muted}>• {programme.theme}</Text> : null}
              </View>
              <Text fontSize={20} fontWeight="700" color={colors.text.primary}>{programme.name}</Text>
              {programme.seasonLabel
                ? <Text fontSize={13} color={colors.text.muted}>Saison {programme.seasonLabel}</Text>
                : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text fontSize={28} fontWeight="700" color={isAcademie ? colors.accent.gold : colors.text.primary}>
                {programme.trainingCount}
              </Text>
              <Text fontSize={11} color={colors.text.muted}>entraînement(s)</Text>
            </View>
          </View>
          {programme.description
            ? <Text fontSize={13} color={colors.text.subtle} style={{ marginTop: 8 }}>{programme.description}</Text>
            : null}
        </View>

        {/* ── Tuiles méthodes (AC2) ──────────────────────────────────────── */}
        <Text fontWeight="700" fontSize={14} color={colors.text.muted} style={{ marginTop: 4, marginBottom: 8 }}>
          MÉTHODES
        </Text>
        <View style={styles.methodGrid}>
          {overview.filter((s) => s.trainingCount > 0 || s.expectedCount != null).map((stat) => {
            const color   = (methodologyMethodColors as Record<string, string>)[stat.method] ?? colors.text.muted
            const isActive = selectedMethod === stat.method
            const pct = stat.expectedCount ? Math.min(100, Math.round((stat.trainingCount / stat.expectedCount) * 100)) : null
            return (
              <Pressable key={stat.method} onPress={() => selectMethod(stat.method)} style={[
                styles.methodTile,
                { borderColor: color, backgroundColor: isActive ? color + '22' : colors.light.surface },
              ]}>
                <View style={[styles.methodDot, { backgroundColor: color }]} />
                <Text fontSize={12} fontWeight="700" color={isActive ? color as never : colors.text.primary} numberOfLines={1} style={{ flex: 1 }}>
                  {stat.method}
                </Text>
                <Text fontSize={12} fontWeight="600" color={color as never}>
                  {stat.trainingCount}{stat.expectedCount != null ? `/${stat.expectedCount}` : ''}
                </Text>
                {pct != null && (
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${pct}%` as never, backgroundColor: color }]} />
                  </View>
                )}
              </Pressable>
            )
          })}
          {overview.filter((s) => s.trainingCount === 0 && s.expectedCount == null).map((stat) => {
            const color   = (methodologyMethodColors as Record<string, string>)[stat.method] ?? colors.text.muted
            const isActive = selectedMethod === stat.method
            return (
              <Pressable key={stat.method} onPress={() => selectMethod(stat.method)} style={[
                styles.methodTile,
                { borderColor: colors.border.light, backgroundColor: isActive ? color + '22' : colors.light.elevated },
              ]}>
                <View style={[styles.methodDot, { backgroundColor: color, opacity: 0.5 }]} />
                <Text fontSize={12} color={colors.text.muted} numberOfLines={1} style={{ flex: 1 }}>{stat.method}</Text>
                <Text fontSize={11} color={colors.text.muted}>0</Text>
              </Pressable>
            )
          })}
        </View>

        {/* ── Breadcrumb + bouton ajout ──────────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {selectedMethod ? (
              <>
                <Text fontSize={13} color={colors.text.muted}>Tous</Text>
                <Text fontSize={13} color={colors.text.muted}>›</Text>
                <Text fontSize={13} fontWeight="600" color={colors.text.primary}>{selectedMethod}</Text>
                {selectedUnit != null && selectedUnit !== 'all' && (
                  <>
                    <Text fontSize={13} color={colors.text.muted}>›</Text>
                    <Text fontSize={13} fontWeight="600" color={colors.text.primary}>
                      {typeof selectedUnit === 'number' ? `Module ${selectedUnit}` : selectedUnit}
                    </Text>
                  </>
                )}
              </>
            ) : (
              <Text fontSize={13} fontWeight="600" color={colors.text.primary}>
                Tous les entraînements ({trainings.length})
              </Text>
            )}
          </View>
          <Pressable onPress={() => setShowForm(!showForm)} style={styles.btnPrimary}>
            <Text color="#000" fontWeight="600" fontSize={13}>+ Ajouter</Text>
          </Pressable>
        </View>

        {/* ── Chips modules / blocs (AC3 / AC4) ────────────────────────── */}
        {selectedMethod && methodHasUnits && unitProgress.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            <Pressable
              onPress={() => setSelectedUnit(null)}
              style={[styles.unitChip, selectedUnit == null && styles.unitChipActive]}
            >
              <Text fontSize={12} fontWeight="600" color={selectedUnit == null ? '#fff' : colors.text.muted}>Tous</Text>
            </Pressable>
            {unitProgress.map((u) => {
              const isActive = selectedUnit === u.moduleOrBloc
              const color    = (methodologyMethodColors as Record<string, string>)[selectedMethod] ?? colors.text.muted
              return (
                <Pressable
                  key={String(u.moduleOrBloc)}
                  onPress={() => selectUnit(u.moduleOrBloc)}
                  style={[styles.unitChip, isActive && { ...styles.unitChipActive, backgroundColor: color }]}
                >
                  <Text fontSize={12} fontWeight="600" color={isActive ? '#fff' : colors.text.muted}>
                    {u.label}
                  </Text>
                  <Text fontSize={11} color={isActive ? '#ffffffbb' : colors.text.muted}>
                    {' '}{u.trainingCount}{u.expectedCount != null ? `/${u.expectedCount}` : ''}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        )}

        {/* ── Formulaire ajout entraînement ─────────────────────────────── */}
        {showForm && (
          <TrainingForm
            tenantId={tenantId}
            programmeId={programmeId!}
            prefillMethod={selectedMethod ?? undefined}
            prefillModule={typeof selectedUnit === 'number' ? selectedUnit : undefined}
            prefillBloc={typeof selectedUnit === 'string' && selectedUnit !== 'all' ? selectedUnit : undefined}
            onCreated={() => { setShowForm(false); load() }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* ── Liste entraînements ────────────────────────────────────────── */}
        <View style={{ marginTop: 8, gap: 8 }}>
          {displayedTrainings.length === 0 ? (
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 32 }]}>
              <Text color={colors.text.muted} style={{ textAlign: 'center' }}>
                {selectedMethod
                  ? 'Aucun entraînement pour cette méthode.'
                  : 'Aucun entraînement dans ce programme.'}
              </Text>
            </View>
          ) : (
            displayedTrainings.map((t) => <TrainingCard key={t.id} training={t} />)
          )}
        </View>
      </View>
    </ScrollView>
  )
}

// ── TrainingCard (AC5) ────────────────────────────────────────────────────────

function TrainingCard({ training }: { training: MethodologySession }) {
  const typeColor = training.trainingType === 'decouverte' ? '#3B82F6'
    : training.trainingType === 'consolidation'           ? '#F97316'
    : null
  const methodColor = training.method
    ? ((methodologyMethodColors as Record<string, string>)[training.method] ?? colors.text.muted)
    : colors.text.muted

  const isOdd = training.trainingNumber != null ? training.trainingNumber % 2 !== 0 : null

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        {training.trainingNumber != null ? (
          <View style={[styles.numBadge, { backgroundColor: methodColor + '22', borderColor: methodColor }]}>
            <Text fontWeight="700" fontSize={15} color={methodColor as never}>{training.trainingNumber}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 6 }}>
          <Text fontWeight="700" fontSize={15} color={colors.text.primary}>{training.title}</Text>

          {/* Chips méthode + module/bloc */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {training.method ? (
              <View style={[styles.chip, { backgroundColor: methodColor + '22', borderColor: methodColor + '44' }]}>
                <Text fontSize={11} fontWeight="600" color={methodColor as never}>{training.method}</Text>
              </View>
            ) : null}
            {training.moduleNumber != null ? (
              <View style={styles.chip}>
                <Text fontSize={11} color={colors.text.muted}>M{training.moduleNumber}</Text>
              </View>
            ) : null}
            {training.blocName ? (
              <View style={styles.chip}>
                <Text fontSize={11} color={colors.text.muted}>{training.blocName}</Text>
              </View>
            ) : null}
            {isOdd != null && training.blocName ? (
              <View style={styles.chip}>
                <Text fontSize={11} color={colors.text.muted}>{isOdd ? '▲ Impair' : '● Pair'}</Text>
              </View>
            ) : null}
          </View>

          {training.description ? (
            <Text fontSize={12} color={colors.text.subtle} numberOfLines={2}>{training.description}</Text>
          ) : null}
        </View>

        {/* Badge type */}
        {typeColor && training.trainingType ? (
          <View style={[styles.badge, { backgroundColor: typeColor }]}>
            <Text fontSize={11} fontWeight="600" color="#fff">
              {TRAINING_TYPE_LABELS[training.trainingType]}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

// ── Formulaire création entraînement (cascading) ──────────────────────────────

function TrainingForm({
  tenantId, programmeId, prefillMethod, prefillModule, prefillBloc, onCreated, onCancel,
}: {
  tenantId       : string
  programmeId    : string
  prefillMethod? : MethodologyMethod
  prefillModule? : number
  prefillBloc?   : string
  onCreated      : () => void
  onCancel       : () => void
}) {
  const [method, setMethod]                 = useState<MethodologyMethod | ''>(prefillMethod ?? '')
  const [moduleNumber, setModuleNumber]     = useState<number | null>(prefillModule ?? null)
  const [blocName, setBlocName]             = useState(prefillBloc ?? '')
  const [trainingNumber, setTrainingNumber] = useState('')
  const [trainingType, setTrainingType]     = useState<TrainingType | ''>('')
  const [title, setTitle]                   = useState('')
  const [description, setDescription]       = useState('')
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [rangeStart, setRangeStart]         = useState<number | null>(null)
  const [rangeEnd, setRangeEnd]             = useState<number | null>(null)
  const [usedNumbers, setUsedNumbers]       = useState<number[]>([])

  const hasModules  = method ? METHODS_WITH_MODULES.includes(method as MethodologyMethod) : false
  const hasBlocs    = method ? METHODS_WITH_BLOCS.includes(method as MethodologyMethod)   : false
  const moduleCount = method ? (MODULE_COUNTS[method] ?? 0) : 0

  useEffect(() => {
    if (!method || !moduleNumber) { setRangeStart(null); setRangeEnd(null); setUsedNumbers([]); return }
    getModuleConfig(method, moduleNumber).then((cfg) => {
      if (cfg) { setRangeStart(cfg.rangeStart); setRangeEnd(cfg.rangeEnd) }
    })
    getUsedTrainingNumbers(programmeId, method as MethodologyMethod, moduleNumber).then(setUsedNumbers)
  }, [method, moduleNumber, programmeId])

  useEffect(() => {
    if (!method || !blocName) { setUsedNumbers([]); return }
    getUsedTrainingNumbers(programmeId, method as MethodologyMethod, blocName).then(setUsedNumbers)
  }, [method, blocName, programmeId])

  async function handleSave() {
    if (!method)       { setError('Choisissez une méthode.'); return }
    if (!title.trim()) { setError('Le titre est obligatoire.'); return }
    if (!tenantId)     { setError('Tenant introuvable.'); return }
    setSaving(true)
    try {
      await createTraining({
        tenantId,
        programmeId,
        method         : method as MethodologyMethod,
        title          : title.trim(),
        trainingType   : trainingType as TrainingType || null,
        moduleNumber   : hasModules ? moduleNumber : null,
        blocName       : hasBlocs   ? (blocName || null) : null,
        trainingNumber : trainingNumber ? parseInt(trainingNumber, 10) : null,
        description    : description.trim() || null,
      })
      onCreated()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[TrainingForm] save:', err)
      setError('Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  const tNum   = trainingNumber ? parseInt(trainingNumber, 10) : null
  const isOdd  = tNum != null ? tNum % 2 !== 0 : null
  const isUsed = tNum != null && usedNumbers.includes(tNum)

  return (
    <View style={[styles.card, { borderColor: colors.border.gold }]}>
      <Text fontWeight="700" fontSize={16} color={colors.text.primary} style={{ marginBottom: 12 }}>
        Nouvel entraînement
      </Text>

      {/* 1. Méthode */}
      <Text style={styles.stepLabel}>1. Méthode *</Text>
      <select
        value={method}
        onChange={(e) => { setMethod(e.target.value as MethodologyMethod); setModuleNumber(null); setBlocName(''); setTrainingNumber('') }}
        style={webSelectStyle}
      >
        <option value="">— Choisir la méthode —</option>
        {METHODOLOGY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      {/* 2. Module */}
      {hasModules && (
        <>
          <Text style={styles.stepLabel}>2. Module *</Text>
          <select
            value={moduleNumber ?? ''}
            onChange={(e) => { setModuleNumber(e.target.value ? parseInt(e.target.value, 10) : null); setTrainingNumber('') }}
            style={webSelectStyle}
          >
            <option value="">— Choisir le module —</option>
            {Array.from({ length: moduleCount }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>Module {n}</option>
            ))}
          </select>
          {rangeStart != null && rangeEnd != null ? (
            <Text fontSize={12} color={colors.text.muted} style={{ marginTop: -8, marginBottom: 12 }}>
              Numéros disponibles : {rangeStart} à {rangeEnd}
            </Text>
          ) : null}
        </>
      )}

      {/* 2. Bloc Situationnel */}
      {hasBlocs && (
        <>
          <Text style={styles.stepLabel}>2. Bloc *</Text>
          <select value={blocName} onChange={(e) => { setBlocName(e.target.value); setTrainingNumber('') }} style={webSelectStyle}>
            <option value="">— Choisir le bloc —</option>
            {SITUATIONNEL_BLOCS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </>
      )}

      {/* 3. Numéro */}
      {(hasModules ? moduleNumber != null : hasBlocs ? !!blocName : !!method) && (
        <>
          <Text style={styles.stepLabel}>
            3. Numéro{rangeStart != null ? ` (${rangeStart}–${rangeEnd})` : ''}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <TextInput
              value={trainingNumber}
              onChangeText={setTrainingNumber}
              keyboardType="number-pad"
              placeholder={rangeStart != null ? `${rangeStart}–${rangeEnd}` : 'Libre'}
              style={[styles.input, { width: 100 }]}
            />
            {isUsed ? <Text fontSize={12} color={colors.accent.red}>⚠️ Déjà utilisé</Text> : null}
            {hasBlocs && isOdd != null ? (
              <Text fontSize={12} color={colors.text.muted}>{isOdd ? '▲ Impair' : '● Pair'}</Text>
            ) : null}
          </View>
        </>
      )}

      {/* 4. Type */}
      {!!method && (
        <>
          <Text style={styles.stepLabel}>4. Type</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {(['decouverte', 'consolidation'] as TrainingType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTrainingType(trainingType === t ? '' : t)}
                style={[
                  styles.typeBtn,
                  trainingType === t && {
                    backgroundColor: t === 'decouverte' ? '#3B82F6' : '#F97316',
                    borderColor     : t === 'decouverte' ? '#3B82F6' : '#F97316',
                  },
                ]}
              >
                <Text fontWeight="600" fontSize={13} color={trainingType === t ? '#fff' : colors.text.muted}>
                  {t === 'decouverte' ? '🔵 Découverte' : '🟠 Consolidation'}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* 5. Titre */}
      <Text style={styles.stepLabel}>5. Titre *</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="ex: Tir cadré après dribble"
        style={[styles.input, { marginBottom: 12 }]}
      />

      {/* 6. Description */}
      <Text style={styles.stepLabel}>6. Description (optionnel)</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Objectif, mise en place…"
        multiline
        numberOfLines={2}
        style={[styles.input, { height: 56, textAlignVertical: 'top', marginBottom: 12 }]}
      />

      {error ? <Text color={colors.accent.red} fontSize={13} style={{ marginBottom: 8 }}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable onPress={onCancel} style={{ padding: 10 }}>
          <Text color={colors.text.muted}>Annuler</Text>
        </Pressable>
        <Pressable onPress={handleSave} disabled={saving} style={[styles.btnPrimary, saving && { opacity: 0.6 }]}>
          {saving
            ? <ActivityIndicator size="small" color="#000" />
            : <Text color="#000" fontWeight="600">Enregistrer</Text>
          }
        </Pressable>
      </View>
    </View>
  )
}

const webSelectStyle: React.CSSProperties = {
  backgroundColor: colors.light.elevated,
  border         : `1px solid ${colors.border.light}`,
  borderRadius   : radius.button,
  padding        : '10px 14px',
  fontSize       : 15,
  color          : colors.text.primary,
  width          : '100%',
  marginBottom   : 12,
}

const styles = StyleSheet.create({
  page         : { padding: 20, gap: 12 },
  center       : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card         : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    padding        : 16,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    boxShadow      : shadows.sm,
  } as never,
  badge        : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs },
  numBadge     : { width: 40, height: 40, borderRadius: radius.xs, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  chip         : {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius     : radius.xs,
    backgroundColor  : colors.light.elevated,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  btnPrimary   : { backgroundColor: colors.accent.gold, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.button, alignItems: 'center' },
  stepLabel    : { fontSize: 13, fontWeight: '600', color: colors.text.muted, marginBottom: 6 },
  input        : {
    backgroundColor: colors.light.elevated,
    borderWidth    : 1, borderColor: colors.border.light,
    borderRadius   : radius.button,
    padding        : 10, fontSize: 15,
    color          : colors.text.primary,
  },
  typeBtn      : {
    flex: 1, padding: 10,
    borderRadius   : radius.button,
    backgroundColor: colors.light.elevated,
    borderWidth    : 1, borderColor: colors.border.light,
    alignItems     : 'center',
  },
  actions      : { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  methodGrid   : { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodTile   : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius   : radius.button,
    borderWidth    : 1.5,
    width          : '47%' as never,
    flexWrap       : 'wrap' as never,
  } as never,
  methodDot    : { width: 8, height: 8, borderRadius: 4 },
  progressBg   : { height: 3, backgroundColor: colors.border.light, borderRadius: 2, width: '100%' as never, marginTop: 4 } as never,
  progressFill : { height: 3, borderRadius: 2 },
  unitChip     : {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius     : radius.button,
    backgroundColor  : colors.light.elevated,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    flexDirection    : 'row',
    alignItems       : 'center',
  },
  unitChipActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
})
