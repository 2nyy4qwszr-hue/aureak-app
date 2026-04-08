'use client'
// Formulaire de création d'un stage
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { createStage, listImplantations } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Implantation, StageType } from '@aureak/types'
import { useToast } from '../../../components/ToastContext'

const STAGE_TYPES: { value: StageType; label: string }[] = [
  { value: 'été',       label: 'Été'          },
  { value: 'toussaint', label: 'Toussaint'    },
  { value: 'hiver',     label: 'Hiver'        },
  { value: 'pâques',    label: 'Pâques'       },
  { value: 'custom',    label: 'Personnalisé' },
]

export default function NewStagePage() {
  const router = useRouter()
  const toast  = useToast()

  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const [name,           setName]           = useState('')
  const [startDate,      setStartDate]      = useState('')
  const [endDate,        setEndDate]        = useState('')
  const [location,       setLocation]       = useState('')
  const [type,           setType]           = useState<StageType | ''>('')
  const [implantationId, setImplantationId] = useState<string>('')
  const [maxParticipants,setMaxParticipants]= useState('')
  const [seasonLabel,    setSeasonLabel]    = useState('')
  const [notes,          setNotes]          = useState('')

  useEffect(() => {
    listImplantations().then(({ data }) => setImplantations(data))
  }, [])

  const isValid = name.trim() && startDate && endDate && startDate <= endDate

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    setError(null)
    try {
      const stage = await createStage({
        name,
        startDate,
        endDate,
        location       : location || null,
        type           : (type as StageType) || null,
        implantationId : implantationId || null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        seasonLabel    : seasonLabel || null,
        notes          : notes || null,
      })
      toast.success(`Stage "${name}" créé avec succès.`)
      router.push(`/stages/${stage.id}` as never)
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Erreur lors de la création'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const dateInputStyle: React.CSSProperties = {
    padding        : '8px 12px',
    borderRadius   : 7,
    border         : `1px solid ${colors.border.light}`,
    backgroundColor: colors.light.muted,
    color          : colors.text.dark,
    fontSize       : 13,
    transition     : 'border-color 0.15s',
    width          : '100%',
    boxSizing      : 'border-box' as const,
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <style>{`.stage-date-inp:focus { outline: none; border-color: ${colors.accent.gold} !important; }`}</style>

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>← Retour</AureakText>
        </Pressable>
        <AureakText variant="h2" color={colors.accent.gold}>Nouveau stage</AureakText>
      </View>

      <View style={s.form}>

        {/* Nom */}
        <View style={s.field}>
          <AureakText variant="caption" style={s.label}>Nom du stage *</AureakText>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Stage Été 2026"
            placeholderTextColor={colors.text.muted}
          />
        </View>

        {/* Type */}
        <View style={s.field}>
          <AureakText variant="caption" style={s.label}>Type</AureakText>
          <View style={s.chipRow}>
            {STAGE_TYPES.map(t => (
              <Pressable
                key={t.value}
                style={[s.chip, type === t.value && s.chipActive]}
                onPress={() => setType(prev => prev === t.value ? '' : t.value)}
              >
                <AureakText
                  variant="caption"
                  style={{ color: type === t.value ? colors.accent.gold : colors.text.muted, fontWeight: type === t.value ? '700' : '400' }}
                >
                  {t.label}
                </AureakText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Dates */}
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={[s.field, { flex: 1 }]}>
            <AureakText variant="caption" style={s.label}>Date de début *</AureakText>
            <input
              className="stage-date-inp"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={dateInputStyle}
            />
          </View>
          <View style={[s.field, { flex: 1 }]}>
            <AureakText variant="caption" style={s.label}>Date de fin *</AureakText>
            <input
              className="stage-date-inp"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={dateInputStyle}
            />
          </View>
        </View>

        {/* Saison */}
        <View style={s.field}>
          <AureakText variant="caption" style={s.label}>Saison</AureakText>
          <TextInput
            style={s.input}
            value={seasonLabel}
            onChangeText={setSeasonLabel}
            placeholder="2025-2026"
            placeholderTextColor={colors.text.muted}
          />
        </View>

        {/* Implantation */}
        <View style={s.field}>
          <AureakText variant="caption" style={s.label}>Implantation</AureakText>
          <View style={s.chipRow}>
            <Pressable
              style={[s.chip, implantationId === '' && s.chipActive]}
              onPress={() => setImplantationId('')}
            >
              <AureakText variant="caption" style={{ color: implantationId === '' ? colors.accent.gold : colors.text.muted }}>
                Aucune
              </AureakText>
            </Pressable>
            {implantations.map(i => (
              <Pressable
                key={i.id}
                style={[s.chip, implantationId === i.id && s.chipActive]}
                onPress={() => setImplantationId(prev => prev === i.id ? '' : i.id)}
              >
                <AureakText variant="caption" style={{ color: implantationId === i.id ? colors.accent.gold : colors.text.muted, fontWeight: implantationId === i.id ? '700' : '400' }}>
                  {i.name}
                </AureakText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={s.field}>
          <AureakText variant="caption" style={s.label}>Lieu (terrain, salle…)</AureakText>
          <TextInput
            style={s.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Stade municipal, Hall A"
            placeholderTextColor={colors.text.muted}
          />
        </View>

        {/* Max participants */}
        <View style={s.field}>
          <AureakText variant="caption" style={s.label}>Participants max</AureakText>
          <TextInput
            style={s.input}
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            placeholder="Ex : 20"
            placeholderTextColor={colors.text.muted}
            keyboardType="number-pad"
          />
        </View>

        {/* Notes */}
        <View style={s.field}>
          <AureakText variant="caption" style={s.label}>Notes internes</AureakText>
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' as never }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Informations complémentaires…"
            placeholderTextColor={colors.text.muted}
            multiline
          />
        </View>

        {error && (
          <View style={s.errorBox}>
            <AureakText variant="caption" style={{ color: colors.accent.red }}>{error}</AureakText>
          </View>
        )}

        <Pressable
          style={[s.saveBtn, !isValid && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!isValid || saving}
        >
          <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' }}>
            {saving ? 'Création…' : 'Créer le stage'}
          </AureakText>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.lg },
  header   : { gap: space.xs },

  form  : { backgroundColor: colors.light.surface, borderRadius: 12, padding: space.lg, gap: space.md, borderWidth: 1, borderColor: colors.border.light },
  field : { gap: 6 },
  label : { color: colors.text.muted, fontSize: 11, textTransform: 'uppercase' as never, letterSpacing: 0.8, fontWeight: '600' },

  input: {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 7,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    color            : colors.text.dark,
    fontSize         : 13,
  },

  chipRow  : { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip     : { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  chipActive: { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '18' },

  errorBox: { backgroundColor: colors.accent.red + '20', borderRadius: 7, padding: space.sm, borderWidth: 1, borderColor: colors.accent.red },

  saveBtn: {
    backgroundColor: colors.accent.gold,
    borderRadius   : 8,
    paddingVertical: space.sm + 2,
    alignItems     : 'center',
    marginTop      : space.xs,
  },
})
