// Story 90.1 — Fiche détail prospect entraîneur (coordonnées, profil, statut, notes)
'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput, Linking, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  getCoachProspect,
  updateCoachProspect,
} from '@aureak/api-client'
import type { CoachProspectDetail, CoachProspectStatus } from '@aureak/types'
import {
  COACH_PROSPECT_STATUS_LABELS,
  COACH_PROSPECT_STATUSES,
} from '@aureak/types'
import { CoachProspectStatusBadge } from '../../../../../components/admin/coach-prospection/CoachProspectStatusBadge'

export default function CoachProspectDetailPage() {
  const { prospectId } = useLocalSearchParams<{ prospectId: string }>()
  const router                          = useRouter()
  const { width }                       = useWindowDimensions()
  const isMobile                        = width <= 640
  const [prospect, setProspect]         = useState<CoachProspectDetail | null>(null)
  const [loading, setLoading]           = useState(true)
  const [notFound, setNotFound]         = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

  const [notesDraft, setNotesDraft]     = useState('')
  const [savingNotes, setSavingNotes]   = useState(false)

  const load = useCallback(async () => {
    if (!prospectId) return
    setLoading(true)
    try {
      const p = await getCoachProspect(prospectId)
      if (!p) {
        setNotFound(true)
      } else {
        setProspect(p)
        setNotesDraft(p.notes ?? '')
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CoachProspectDetailPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [prospectId])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(nextStatus: CoachProspectStatus) {
    if (!prospect || nextStatus === prospect.status) return
    setSavingStatus(true)
    try {
      await updateCoachProspect({ id: prospect.id, status: nextStatus })
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CoachProspectDetailPage] status error:', err)
    } finally {
      setSavingStatus(false)
    }
  }

  async function handleNotesSave() {
    if (!prospect) return
    if ((notesDraft ?? '') === (prospect.notes ?? '')) return
    setSavingNotes(true)
    try {
      await updateCoachProspect({ id: prospect.id, notes: notesDraft || null })
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CoachProspectDetailPage] notes error:', err)
    } finally {
      setSavingNotes(false)
    }
  }

  if (loading) {
    return <View style={st.container}><AureakText style={st.loading as never}>Chargement…</AureakText></View>
  }
  if (notFound || !prospect) {
    return (
      <View style={st.container}>
        <AureakText style={st.loading as never}>Prospect introuvable.</AureakText>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <AureakText style={st.backBtnLabel as never}>← Retour</AureakText>
        </Pressable>
      </View>
    )
  }

  const fullName = `${prospect.firstName} ${prospect.lastName}`
  const notesDirty = (notesDraft ?? '') !== (prospect.notes ?? '')

  return (
    <ScrollView style={st.scroll} contentContainerStyle={[st.content, isMobile && { padding: 16 }]}>
      <Pressable onPress={() => router.back()} style={st.backLink}>
        <AureakText style={st.backLinkLabel as never}>← Retour au pipeline</AureakText>
      </Pressable>

      <View style={st.headerCard}>
        <View style={st.headerInfo}>
          <AureakText style={st.fullName as never}>{fullName}</AureakText>
          <AureakText style={st.headerSub as never}>
            {prospect.city ?? '—'} · Commercial : {prospect.assignedDisplayName ?? '—'}
          </AureakText>
          <View style={{ marginTop: space.xs }}>
            <CoachProspectStatusBadge status={prospect.status} />
          </View>
        </View>
      </View>

      <View style={st.section}>
        <AureakText style={st.sectionTitle as never}>Statut pipeline</AureakText>
        <View style={st.chipRow}>
          {COACH_PROSPECT_STATUSES.map(s => (
            <Pressable
              key={s}
              onPress={() => handleStatusChange(s)}
              disabled={savingStatus}
              style={[st.chip, prospect.status === s && st.chipActive, savingStatus && { opacity: 0.5 }] as never}
            >
              <AureakText style={(prospect.status === s ? st.chipActiveLabel : st.chipLabel) as never}>
                {COACH_PROSPECT_STATUS_LABELS[s]}
              </AureakText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={st.section}>
        <AureakText style={st.sectionTitle as never}>Coordonnées</AureakText>
        <View style={st.metaGrid}>
          <View style={st.metaRow}>
            <AureakText style={st.metaLabel as never}>EMAIL</AureakText>
            {prospect.email ? (
              <Pressable onPress={() => Linking.openURL(`mailto:${prospect.email}`)}>
                <AureakText style={st.metaLink as never}>{prospect.email}</AureakText>
              </Pressable>
            ) : (
              <AureakText style={st.metaValue as never}>—</AureakText>
            )}
          </View>
          <View style={st.metaRow}>
            <AureakText style={st.metaLabel as never}>TÉLÉPHONE</AureakText>
            {prospect.phone ? (
              <Pressable onPress={() => Linking.openURL(`tel:${prospect.phone}`)}>
                <AureakText style={st.metaLink as never}>{prospect.phone}</AureakText>
              </Pressable>
            ) : (
              <AureakText style={st.metaValue as never}>—</AureakText>
            )}
          </View>
        </View>
      </View>

      <View style={st.section}>
        <AureakText style={st.sectionTitle as never}>Profil</AureakText>
        <View style={st.metaGrid}>
          <View style={st.metaRow}>
            <AureakText style={st.metaLabel as never}>CLUB ACTUEL</AureakText>
            <AureakText style={st.metaValue as never}>{prospect.currentClub ?? '—'}</AureakText>
          </View>
          <View style={st.metaRow}>
            <AureakText style={st.metaLabel as never}>SPÉCIALITÉ</AureakText>
            <AureakText style={st.metaValue as never}>{prospect.specialite ?? '—'}</AureakText>
          </View>
          <View style={st.metaRow}>
            <AureakText style={st.metaLabel as never}>SOURCE</AureakText>
            <AureakText style={st.metaValue as never}>{prospect.source ?? '—'}</AureakText>
          </View>
          <View style={st.metaRow}>
            <AureakText style={st.metaLabel as never}>CRÉÉ LE</AureakText>
            <AureakText style={st.metaValue as never}>
              {new Date(prospect.createdAt).toLocaleDateString('fr-BE', { day: '2-digit', month: 'long', year: 'numeric' })}
            </AureakText>
          </View>
        </View>
      </View>

      <View style={st.section}>
        <View style={st.sectionHeader}>
          <AureakText style={st.sectionTitle as never}>Notes</AureakText>
          {notesDirty && (
            <Pressable
              style={[st.saveBtn, savingNotes && { opacity: 0.5 }] as never}
              onPress={handleNotesSave}
              disabled={savingNotes}
            >
              <AureakText style={st.saveBtnLabel as never}>
                {savingNotes ? 'Enregistrement…' : 'Enregistrer'}
              </AureakText>
            </Pressable>
          )}
        </View>
        <TextInput
          style={[st.notesInput, st.textarea] as never}
          value={notesDraft}
          onChangeText={setNotesDraft}
          multiline
          numberOfLines={5}
          placeholder="Notes commercial / admin…"
        />
      </View>

      {prospect.recommendedByDisplayName && (
        <View style={st.section}>
          <AureakText style={st.sectionTitle as never}>Recommandation</AureakText>
          <View style={st.recoBadge}>
            <AureakText style={st.recoBadgeIcon as never}>🤝</AureakText>
            <View style={{ flex: 1 }}>
              <AureakText style={st.recoBadgeTitle as never}>
                Recommandé par {prospect.recommendedByDisplayName}
              </AureakText>
              <AureakText style={st.recoBadgeSub as never}>
                Source : recommandation coach interne
              </AureakText>
            </View>
          </View>
          {prospect.notes && prospect.source === 'recommandation_coach' && (
            <View style={st.recoContext}>
              <AureakText style={st.recoContextLabel as never}>CONTEXTE DE LA RECOMMANDATION</AureakText>
              <AureakText style={st.recoContextText as never}>{prospect.notes}</AureakText>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}

const st = StyleSheet.create({
  scroll : { flex: 1, backgroundColor: colors.light.primary },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },
  container: { flex: 1, padding: space.xl, gap: space.md, backgroundColor: colors.light.primary },
  loading: { color: colors.text.muted, fontStyle: 'italic' },

  backLink: { alignSelf: 'flex-start' },
  backLinkLabel: { color: colors.accent.gold, fontSize: 13, fontWeight: '600' },
  backBtn: { alignSelf: 'flex-start', paddingHorizontal: space.md, paddingVertical: space.sm,
    borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider },
  backBtnLabel: { color: colors.text.dark },

  headerCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.xl,
    // @ts-ignore
    boxShadow      : shadows.sm,
  },
  headerInfo: { gap: 6 },
  fullName  : { fontSize: 28, fontFamily: fonts.display, fontWeight: '700', color: colors.text.dark },
  headerSub : { color: colors.text.muted, fontSize: 13 },

  section      : { gap: space.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  sectionTitle : { color: colors.text.dark, fontSize: 14, fontWeight: '700', fontFamily: fonts.display, letterSpacing: 0.3 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  chipActive     : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  chipLabel      : { color: colors.text.muted, fontSize: 12 },
  chipActiveLabel: { color: colors.light.surface, fontSize: 12, fontWeight: '700' },

  metaGrid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
  },
  metaRow  : { gap: 2, minWidth: 180 },
  metaLabel: { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  metaValue: { color: colors.text.dark, fontSize: 13 },
  metaLink : { color: colors.accent.gold, fontSize: 13, fontWeight: '600' },

  notesInput: {
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    color            : colors.text.dark,
    backgroundColor  : colors.light.surface,
  },
  textarea: { minHeight: 110, textAlignVertical: 'top' },

  saveBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  saveBtnLabel: { color: colors.text.dark, fontSize: 12, fontWeight: '700' },

  // Story 90.2 — badge recommandation
  recoBadge: {
    flexDirection   : 'row',
    alignItems      : 'center',
    gap             : space.md,
    paddingVertical : space.md,
    paddingHorizontal: space.md,
    backgroundColor : colors.border.goldBg,
    borderWidth     : 1,
    borderColor     : colors.accent.gold,
    borderRadius    : radius.card,
  },
  recoBadgeIcon : { fontSize: 22 },
  recoBadgeTitle: { color: colors.text.dark, fontSize: 14, fontWeight: '700' },
  recoBadgeSub  : { color: colors.text.muted, fontSize: 12, marginTop: 2 },
  recoContext: {
    marginTop       : space.sm,
    paddingVertical : space.sm,
    paddingHorizontal: space.md,
    backgroundColor : colors.light.surface,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    borderRadius    : radius.xs,
    gap             : space.xs,
  },
  recoContextLabel: { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  recoContextText : { color: colors.text.dark, fontSize: 13, lineHeight: 18 },
})
