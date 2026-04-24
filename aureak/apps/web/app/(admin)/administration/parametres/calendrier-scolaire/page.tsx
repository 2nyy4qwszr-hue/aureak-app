// Story 13.2 — Settings : Calendrier scolaire belge
// Story 99.4 — AdminPageHeader v2 ("Calendrier scolaire")
// Permet à l'admin d'ajouter, visualiser et supprimer les exceptions de calendrier
// (jours sans séance : vacances, jours fériés, etc.)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import {
  listSchoolCalendarExceptions,
  addSchoolCalendarException,
  removeSchoolCalendarException,
} from '@aureak/api-client'
import { AureakText, AureakButton } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { SchoolCalendarException } from '@aureak/types'
import { AdminPageHeader } from '../../../../../components/admin/AdminPageHeader'

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function SchoolCalendarPage() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width <= 640

  const [exceptions, setExceptions] = useState<SchoolCalendarException[]>([])
  const [loading,    setLoading   ] = useState(true)
  const [adding,     setAdding    ] = useState(false)

  // Form state
  const [newDate,    setNewDate  ] = useState('')
  const [newLabel,   setNewLabel ] = useState('')
  const [formError,  setFormError] = useState<string | null>(null)
  const [saving,     setSaving   ] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await listSchoolCalendarExceptions()
      setExceptions(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SchoolCalendar] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!newDate.trim()) { setFormError('La date est obligatoire (YYYY-MM-DD).'); return }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate.trim())) { setFormError('Format de date invalide. Utilisez YYYY-MM-DD.'); return }
    if (!newLabel.trim()) { setFormError('Le libellé est obligatoire.'); return }
    setFormError(null)
    setSaving(true)
    try {
      const { error } = await addSchoolCalendarException({
        date       : newDate.trim(),
        label      : newLabel.trim(),
        isNoSession: true,
      })
      if (error) {
        setFormError('Erreur lors de l\'ajout. Cette date existe peut-être déjà.')
      } else {
        setNewDate('')
        setNewLabel('')
        setAdding(false)
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    await removeSchoolCalendarException(id)
    load()
  }

  // Grouper par année
  const grouped = exceptions.reduce<Record<string, SchoolCalendarException[]>>((acc, e) => {
    const year = e.date.slice(0, 4)
    if (!acc[year]) acc[year] = []
    acc[year].push(e)
    return acc
  }, {})

  return (
    <View style={{ flex: 1, backgroundColor: colors.light.primary }}>
      {/* Story 99.4 — AdminPageHeader v2 */}
      <AdminPageHeader
        title="Calendrier scolaire"
        actionButton={{
          label  : '+ Ajouter une exception',
          onPress: () => { setAdding(v => !v); setFormError(null) },
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: space.md }]}>
      {/* ── Header (retrait — titre via AdminPageHeader) ── */}
      <View style={styles.header}>
        <Pressable
          style={styles.addBtn}
          onPress={() => { setAdding(v => !v); setFormError(null) }}
        >
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            {adding ? '✕ Annuler' : '+ Ajouter une exception'}
          </AureakText>
        </Pressable>
      </View>

      {/* ── Formulaire d'ajout ── */}
      {adding && (
        <View style={styles.formCard}>
          <AureakText variant="label" style={styles.formTitle}>Nouvelle exception</AureakText>
          <AureakText variant="caption" style={styles.fieldLabel}>Date (YYYY-MM-DD) *</AureakText>
          <TextInput
            style={styles.input}
            value={newDate}
            onChangeText={setNewDate}
            placeholder="ex: 2026-04-06"
          />
          <AureakText variant="caption" style={styles.fieldLabel}>Libellé *</AureakText>
          <TextInput
            style={styles.input}
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder="ex: Vacances Pâques"
          />
          {formError && (
            <AureakText variant="caption" style={{ color: colors.accent.red, marginTop: 4 }}>{formError}</AureakText>
          )}
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
            <AureakButton
              label={saving ? 'Enregistrement…' : 'Ajouter'}
              onPress={handleAdd}
              variant="primary"
            />
          </View>
        </View>
      )}

      {/* ── Liste des exceptions ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
        </View>
      ) : exceptions.length === 0 ? (
        <View style={styles.emptyState}>
          <AureakText variant="body" style={{ color: colors.text.muted }}>Aucune exception configurée.</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
            Cliquez sur "+ Ajouter une exception" pour définir des jours sans séance.
          </AureakText>
        </View>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([year, items]) => (
            <View key={year} style={styles.yearGroup}>
              <AureakText variant="caption" style={styles.yearLabel}>{year}</AureakText>
              <View style={styles.table}>
                {items.map((e, idx) => (
                  <View key={e.id} style={[styles.row, idx % 2 === 1 && styles.rowAlt]}>
                    <View style={{ flex: 1 }}>
                      <AureakText variant="body" style={{ fontWeight: '600', fontSize: 13 }}>
                        {fmtDate(e.date)}
                      </AureakText>
                      <AureakText variant="caption" style={{ color: colors.text.muted }}>
                        {e.label}
                      </AureakText>
                    </View>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => handleRemove(e.id)}
                    >
                      <AureakText variant="caption" style={{ color: colors.accent.red, fontSize: 11 }}>
                        Supprimer
                      </AureakText>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ))
      )}

      {/* ── Info ── */}
      <View style={styles.infoBox}>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>
          ℹ️ Ces exceptions s'appliquent uniquement à votre tenant. Elles sont utilisées lors de la génération automatique des séances (⚡ Générer les séances). Les séances déjà générées ne sont pas modifiées.
        </AureakText>
      </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.xl, gap: space.md },
  header    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.md },
  breadcrumb: { marginBottom: 4 },
  addBtn    : {
    backgroundColor: colors.accent.gold, paddingHorizontal: space.md,
    paddingVertical: space.xs + 2, borderRadius: 7, flexShrink: 0,
  },
  formCard  : {
    backgroundColor: colors.light.surface, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border.light, padding: space.md,
    gap: 4, boxShadow: shadows.sm as never,
  },
  formTitle : { color: colors.text.dark, fontWeight: '700', marginBottom: 4 },
  fieldLabel: { color: colors.text.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as never, letterSpacing: 0.8, marginTop: 8 },
  input     : {
    borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs,
    padding: space.sm, color: colors.text.dark, backgroundColor: colors.light.primary,
  },
  loadingBox: { padding: space.xxl, alignItems: 'center' },
  emptyState: {
    backgroundColor: colors.light.surface, borderRadius: 10,
    padding: space.xxl, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border.light, boxShadow: shadows.sm as never,
  },
  yearGroup : { gap: space.xs },
  yearLabel : {
    color: colors.text.muted, fontWeight: '700', fontSize: 10,
    textTransform: 'uppercase' as never, letterSpacing: 1.5,
  },
  table     : {
    backgroundColor: colors.light.surface, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border.light, overflow: 'hidden', boxShadow: shadows.sm as never,
  },
  row       : {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.md, paddingVertical: space.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border.divider,
  },
  rowAlt    : { backgroundColor: colors.light.muted },
  deleteBtn : {
    paddingHorizontal: space.sm, paddingVertical: 4,
    borderRadius: 5, borderWidth: 1, borderColor: colors.accent.red + '80',
    backgroundColor: colors.accent.red + '15',
  },
  infoBox   : {
    backgroundColor: colors.light.surface, borderRadius: 8, padding: space.md,
    borderWidth: 1, borderColor: colors.border.light,
  },
})
