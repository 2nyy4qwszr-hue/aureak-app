'use client'
// Story 89.2 — Section "Observations scout" sur fiche joueur (/children/[childId])
// Auto-chargée : stats + historique évaluations.
// Accessible uniquement si role admin | commercial (gate via props `canEvaluate`).
// Auteur peut éditer dans les 24h ; admin peut toujours supprimer.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { AureakText, StarRating } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import { useAuthStore } from '@aureak/business-logic'
import {
  listScoutEvaluationsByChild,
  getScoutEvaluationStats,
  deleteScoutEvaluation,
} from '@aureak/api-client'
import type {
  ProspectScoutEvaluation,
  ProspectScoutEvaluationWithAuthor,
  ProspectScoutEvaluationStats,
  ScoutObservationContext,
} from '@aureak/types'
import { ScoutEvaluationModal } from './_ScoutEvaluationModal'
import { useToast } from '../../../../components/ToastContext'

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  childId     : string
  childName   : string
  canEvaluate : boolean   // role === 'admin' || role === 'commercial'
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isWithin24h(createdAt: string): boolean {
  const created = new Date(createdAt).getTime()
  return Date.now() - created < 24 * 60 * 60 * 1000
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const CTX_LABELS: Record<ScoutObservationContext, string> = {
  match             : 'Match',
  tournoi           : 'Tournoi',
  entrainement_club : 'Entraînement club',
  autre             : 'Autre',
}

const CTX_COLORS: Record<ScoutObservationContext, { bg: string; text: string }> = {
  match             : { bg: colors.border.goldBg,      text: colors.accent.gold   },
  tournoi           : { bg: colors.status.amberBg,     text: colors.status.amberText },
  entrainement_club : { bg: colors.status.successBg,   text: colors.status.successText },
  autre             : { bg: colors.light.muted,        text: colors.text.muted    },
}

// ── Sub-component : troncature "Voir plus" ─────────────────────────────────────

function TruncatedText({ text, max = 160 }: { text: string; max?: number }) {
  const [expanded, setExpanded] = useState(false)
  if (text.length <= max) {
    return <AureakText variant="bodySm" style={{ color: colors.text.dark }}>{text}</AureakText>
  }
  return (
    <View>
      <AureakText variant="bodySm" style={{ color: colors.text.dark }}>
        {expanded ? text : text.slice(0, max) + '…'}
      </AureakText>
      <Pressable onPress={() => setExpanded(v => !v)}>
        <AureakText variant="caption" style={{ color: colors.accent.gold, marginTop: 2 }}>
          {expanded ? 'Voir moins' : 'Voir plus'}
        </AureakText>
      </Pressable>
    </View>
  )
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function ScoutEvaluationsSection({ childId, childName, canEvaluate }: Props) {
  const authUserId = useAuthStore((st) => st.user?.id ?? null)
  const authRole   = useAuthStore((st) => st.role)
  const authTenant = useAuthStore((st) => st.tenantId)
  const toast      = useToast()

  const [evaluations, setEvaluations] = useState<ProspectScoutEvaluationWithAuthor[]>([])
  const [stats,       setStats]       = useState<ProspectScoutEvaluationStats | null>(null)
  const [loading,     setLoading]     = useState<boolean>(true)

  const [modalVisible, setModalVisible] = useState(false)
  const [editTarget,   setEditTarget]   = useState<ProspectScoutEvaluation | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, st] = await Promise.all([
        listScoutEvaluationsByChild(childId),
        getScoutEvaluationStats(childId),
      ])
      setEvaluations(list)
      setStats(st)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ScoutEvaluationsSection] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => {
    // Si user ne peut pas évaluer, on évite même de charger (rendu vide)
    if (!canEvaluate) { setLoading(false); return }
    void load()
  }, [canEvaluate, load])

  async function handleDelete(id: string) {
    try {
      await deleteScoutEvaluation(id)
      toast.success('Évaluation supprimée')
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ScoutEvaluationsSection] delete error:', err)
      toast.error("Échec de la suppression")
    }
  }

  function openCreate() {
    setEditTarget(null)
    setModalVisible(true)
  }

  function openEdit(ev: ProspectScoutEvaluation) {
    setEditTarget(ev)
    setModalVisible(true)
  }

  async function handleSaved() {
    toast.success(editTarget ? 'Évaluation mise à jour' : 'Évaluation enregistrée')
    await load()
  }

  const headerSubtitle = useMemo(() => {
    if (!stats || stats.count === 0) return null
    const parts: string[] = []
    if (stats.averageRating !== null) parts.push(`${stats.averageRating.toFixed(1).replace('.', ',')} ★`)
    parts.push(`${stats.count} évaluation${stats.count > 1 ? 's' : ''}`)
    if (stats.lastDate) {
      const author = stats.lastAuthorName ? ` par ${stats.lastAuthorName}` : ''
      parts.push(`dernière le ${formatDate(stats.lastDate)}${author}`)
    }
    return parts.join(' · ')
  }, [stats])

  // Rôles sans droit → rien à afficher (gate UI stricte côté sous-section, AC #2)
  if (!canEvaluate) return null

  return (
    <View style={s.card}>
      {/* En-tête */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <AureakText variant="h3" style={{ color: colors.text.dark }}>
            Observations scout
          </AureakText>
          {headerSubtitle && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 6 }}>
              {stats && stats.averageRating !== null && (
                <StarRating value={Math.round(stats.averageRating)} size={18} />
              )}
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                {headerSubtitle}
              </AureakText>
            </View>
          )}
        </View>
        {/* CTA principal — visible seulement s'il y a déjà des évals (sinon CTA dans l'état vide) */}
        {evaluations.length > 0 && (
          <Pressable style={s.primaryBtn} onPress={openCreate}>
            <AureakText variant="caption" style={{ color: '#fff', fontWeight: '700' as never }}>
              Évaluer ce gardien
            </AureakText>
          </Pressable>
        )}
      </View>

      {/* Contenu */}
      {loading ? (
        <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: space.sm }}>
          Chargement…
        </AureakText>
      ) : evaluations.length === 0 ? (
        <View style={s.emptyWrap}>
          <AureakText style={{ fontSize: 32, color: colors.border.light }}>★</AureakText>
          <AureakText variant="bodySm" style={{ color: colors.text.muted, textAlign: 'center' as never, marginTop: space.xs }}>
            Aucune observation terrain — soyez le premier à évaluer ce gardien
          </AureakText>
          <Pressable style={[s.primaryBtn, { marginTop: space.sm }]} onPress={openCreate}>
            <AureakText variant="caption" style={{ color: '#fff', fontWeight: '700' as never }}>
              Évaluer ce gardien
            </AureakText>
          </Pressable>
        </View>
      ) : (
        <View style={{ marginTop: space.sm }}>
          {evaluations.map((ev, idx) => {
            const isAuthor    = authUserId !== null && ev.evaluatorId === authUserId
            const within24h   = isWithin24h(ev.createdAt)
            const canEdit     = isAuthor && within24h
            const canDelete   = canEdit || authRole === 'admin'
            const dateToShow  = ev.observationDate ?? ev.createdAt
            const authorLabel = ev.authorName ?? ev.authorEmail ?? 'Scout inconnu'
            const ctxColor    = ev.observationContext ? CTX_COLORS[ev.observationContext] : null
            const ctxLabel    = ev.observationContext ? CTX_LABELS[ev.observationContext] : null

            return (
              <View
                key={ev.id}
                style={[s.item, idx === evaluations.length - 1 && { borderBottomWidth: 0 }]}
              >
                {/* Ligne top : étoiles + badge contexte + date + actions */}
                <View style={s.itemTopRow}>
                  <StarRating value={ev.ratingStars} size={16} />
                  {ctxColor && ctxLabel && (
                    <View style={[s.ctxBadge, { backgroundColor: ctxColor.bg }]}>
                      <AureakText variant="caption" style={{ color: ctxColor.text, fontSize: 10, fontWeight: '700' as never }}>
                        {ctxLabel}
                      </AureakText>
                    </View>
                  )}
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>
                    {formatDate(dateToShow)}
                  </AureakText>
                  <View style={{ flex: 1 }} />
                  {canEdit && (
                    <Pressable onPress={() => openEdit(ev)} style={s.iconBtn}>
                      <AureakText variant="caption" style={{ color: colors.accent.gold }}>Éditer</AureakText>
                    </Pressable>
                  )}
                  {canDelete && (
                    <Pressable onPress={() => handleDelete(ev.id)} style={s.iconBtn}>
                      <AureakText variant="caption" style={{ color: colors.status.errorText }}>Supprimer</AureakText>
                    </Pressable>
                  )}
                </View>

                {/* Auteur */}
                <AureakText variant="caption" style={{ color: colors.text.subtle, marginTop: 4 }}>
                  par {authorLabel}
                </AureakText>

                {/* Commentaire tronqué */}
                {ev.comment && (
                  <View style={{ marginTop: space.xs }}>
                    <TruncatedText text={ev.comment} />
                  </View>
                )}
              </View>
            )
          })}
        </View>
      )}

      {/* Modal création/édition */}
      {authTenant && (
        <ScoutEvaluationModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSaved={handleSaved}
          childId={childId}
          tenantId={authTenant}
          childName={childName}
          initialValue={editTarget ?? undefined}
        />
      )}
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card          : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    marginBottom   : space.md,
    boxShadow      : shadows.sm as never,
  },
  headerRow     : {
    flexDirection : 'row',
    alignItems    : 'flex-start',
    justifyContent: 'space-between',
    gap           : space.sm,
  },
  primaryBtn    : {
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
    minHeight        : 44,
    alignItems       : 'center',
    justifyContent   : 'center',
  },
  emptyWrap     : {
    alignItems    : 'center',
    paddingVertical: space.lg,
    gap           : 2,
  },
  item          : {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingVertical  : space.sm,
  },
  itemTopRow    : {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    flexWrap     : 'wrap',
  },
  ctxBadge      : {
    paddingHorizontal: 8,
    paddingVertical  : 2,
    borderRadius     : radius.badge,
  },
  iconBtn       : {
    paddingHorizontal: space.xs,
    paddingVertical  : 4,
  },
})
