// Page de review manuelle des matchings RBFA ambigus
// Accessible depuis /clubs/rbfa-sync → bouton "X à valider"
// Chaque carte montre : nom local ↔ nom RBFA + score + logo preview
// Actions : Confirmer (import logo + match) | Rejeter

import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Image } from 'react-native'
import { useRouter } from 'expo-router'
import {
  listPendingMatchReviews,
  confirmMatchReview,
  rejectMatchReview,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { ClubMatchReview } from '@aureak/types'

// ── Barre de score ─────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 55
    ? colors.status.success
    : score >= 25
      ? colors.accent.goldLight
      : colors.status.errorStrong
  return (
    <View style={sb.track}>
      <View style={[sb.fill, { width: `${score}%` as never, backgroundColor: color }]} />
    </View>
  )
}
const sb = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border.light, overflow: 'hidden' },
  fill : { height: 6, borderRadius: 3 },
})

// ── Carte de review ────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  onConfirm,
  onReject,
  processing,
}: {
  review    : ClubMatchReview
  onConfirm : (id: string) => void
  onReject  : (id: string) => void
  processing: string | null
}) {
  const c = review.rbfaCandidate
  const busy = processing === review.id

  return (
    <View style={card.wrap}>
      {/* En-tête : score */}
      <View style={card.header}>
        <View style={{ flex: 1 }}>
          <ScoreBar score={review.matchScore} />
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 3 }}>
            Score : {review.matchScore}/100
          </AureakText>
        </View>
        <View style={card.scoreBadge}>
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 11 }}>
            À VALIDER
          </AureakText>
        </View>
      </View>

      {/* Corps : local ↔ RBFA */}
      <View style={card.body}>

        {/* Local */}
        <View style={card.side}>
          <AureakText variant="caption" style={card.sideLabel}>Notre base</AureakText>
          <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700', flexShrink: 1 }}>
            {review.clubNom ?? review.clubDirectoryId}
          </AureakText>
        </View>

        {/* Flèche */}
        <AureakText style={{ color: colors.text.muted, fontSize: 20, paddingHorizontal: space.sm }}>↔</AureakText>

        {/* RBFA */}
        <View style={card.side}>
          <AureakText variant="caption" style={card.sideLabel}>RBFA</AureakText>
          <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700', flexShrink: 1 }}>
            {c.nom}
          </AureakText>
          {c.matricule && (
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
              #{c.matricule}
            </AureakText>
          )}
        </View>

        {/* Logo preview */}
        {c.logoUrl ? (
          <View style={card.logoWrap}>
            <Image
              source={{ uri: c.logoUrl }}
              style={card.logo}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={[card.logoWrap, { backgroundColor: colors.light.elevated, alignItems: 'center', justifyContent: 'center' }]}>
            <AureakText style={{ fontSize: 22 }}>🏟️</AureakText>
          </View>
        )}
      </View>

      {/* Détail du score */}
      <View style={card.detail}>
        {review.scoreDetail.matricule > 0 && (
          <View style={card.pill}>
            <AureakText variant="caption" style={card.pillText}>Matricule ✓</AureakText>
          </View>
        )}
        {review.scoreDetail.nomExact > 0 && (
          <View style={card.pill}>
            <AureakText variant="caption" style={card.pillText}>Nom exact ✓</AureakText>
          </View>
        )}
        {review.scoreDetail.nomSimilarite > 0 && (
          <View style={card.pill}>
            <AureakText variant="caption" style={card.pillText}>Nom ~{Math.round(review.scoreDetail.nomSimilarite)}pts</AureakText>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={card.actions}>
        <Pressable
          style={[card.rejectBtn, busy && card.btnBusy]}
          onPress={() => onReject(review.id)}
          disabled={!!processing}
        >
          <AureakText variant="caption" style={{ color: colors.status.errorStrong, fontWeight: '700' }}>
            {busy ? '…' : 'Rejeter'}
          </AureakText>
        </Pressable>

        <Pressable
          style={[card.confirmBtn, busy && card.btnBusy]}
          onPress={() => onConfirm(review.id)}
          disabled={!!processing}
        >
          <AureakText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
            {busy ? 'En cours…' : 'Confirmer le match'}
          </AureakText>
        </Pressable>
      </View>
    </View>
  )
}

const card = StyleSheet.create({
  wrap      : {
    backgroundColor: colors.light.surface,
    borderRadius   : 14,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    gap            : space.sm,
    elevation: 1,
  },
  header    : { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  scoreBadge: {
    backgroundColor: colors.status.warningBg,
    borderRadius   : 6,
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderWidth    : 1,
    borderColor    : colors.accent.goldLight,
  },
  body      : { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  side      : { flex: 1, gap: 2 },
  sideLabel : { color: colors.text.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  logoWrap  : {
    width : 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  logo      : { width: '100%' as never, height: '100%' as never },
  detail    : { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill      : {
    backgroundColor: colors.light.elevated,
    borderRadius   : 6,
    paddingHorizontal: 8,
    paddingVertical  : 3,
  },
  pillText  : { color: colors.text.muted, fontSize: 11 },
  actions   : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', paddingTop: space.xs },
  confirmBtn: {
    backgroundColor  : colors.status.success,
    borderRadius     : 8,
    paddingVertical  : 9,
    paddingHorizontal: space.md,
  },
  rejectBtn : {
    borderRadius     : 8,
    borderWidth      : 1,
    borderColor      : colors.status.errorStrong,
    paddingVertical  : 9,
    paddingHorizontal: space.md,
  },
  btnBusy   : { opacity: 0.5 },
})

// ── Page principale ────────────────────────────────────────────────────────────

export default function RbfaReviewsPage() {
  const router   = useRouter()
  const user     = useAuthStore((s) => s.user)
  const tenantId = useAuthStore((s) => s.tenantId)

  const [reviews,    setReviews]    = useState<ClubMatchReview[]>([])
  const [loading,    setLoading]    = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [done,       setDone]       = useState<{ id: string; action: 'confirmed' | 'rejected' }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await listPendingMatchReviews(tenantId ?? undefined)
      setReviews(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[rbfa-sync/reviews] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { load() }, [load])

  const handleConfirm = async (reviewId: string) => {
    setProcessing(reviewId)
    try {
      await confirmMatchReview({ reviewId, reviewedBy: user?.id ?? 'admin' })
      setDone(prev => [...prev, { id: reviewId, action: 'confirmed' }])
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[rbfa-sync/reviews] handleConfirm error:', err)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (reviewId: string) => {
    setProcessing(reviewId)
    try {
      await rejectMatchReview({ reviewId, reviewedBy: user?.id ?? 'admin' })
      setDone(prev => [...prev, { id: reviewId, action: 'rejected' }])
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[rbfa-sync/reviews] handleReject error:', err)
    } finally {
      setProcessing(null)
    }
  }

  const confirmed = done.filter(d => d.action === 'confirmed').length
  const rejected  = done.filter(d => d.action === 'rejected').length

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Retour</AureakText>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <AureakText variant="h2" color={colors.accent.gold}>Matchings à valider</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
              Ces clubs ont un score de matching intermédiaire (25–54).{'\n'}
              Confirme ou rejette chaque association manuellement.
            </AureakText>
          </View>
          {(confirmed > 0 || rejected > 0) && (
            <View style={s.sessionBadge}>
              <AureakText variant="caption" style={{ color: colors.status.success, fontWeight: '700' }}>
                {confirmed} ✓
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.status.errorStrong, fontWeight: '700' }}>
                {rejected} ✕
              </AureakText>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.empty}>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>Chargement…</AureakText>
        </View>
      ) : reviews.length === 0 ? (
        <View style={s.empty}>
          <AureakText style={{ fontSize: 40, marginBottom: space.md }}>🎉</AureakText>
          <AureakText variant="h3" style={{ color: colors.text.dark }}>
            {done.length > 0 ? 'Toutes les reviews traitées !' : 'Aucune review en attente'}
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4, textAlign: 'center' }}>
            {done.length > 0
              ? `${confirmed} confirmé${confirmed > 1 ? 's' : ''}, ${rejected} rejeté${rejected > 1 ? 's' : ''}`
              : 'Lance l\'import RBFA pour générer des reviews.'}
          </AureakText>
          <Pressable style={s.backToSyncBtn} onPress={() => router.back()}>
            <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' }}>
              Retour à l'import
            </AureakText>
          </Pressable>
        </View>
      ) : (
        <View style={s.list}>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: space.sm }}>
            {reviews.length} club{reviews.length > 1 ? 's' : ''} en attente
          </AureakText>
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onConfirm={handleConfirm}
              onReject={handleReject}
              processing={processing}
            />
          ))}
        </View>
      )}

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.light.primary },
  content     : { padding: space.lg, gap: space.lg },
  header      : { gap: space.sm },
  backBtn     : { marginBottom: 2 },
  sessionBadge: {
    flexDirection  : 'row',
    gap            : space.md,
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    paddingVertical: 8,
    paddingHorizontal: space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  list        : { gap: space.md },
  empty       : {
    backgroundColor: colors.light.surface,
    borderRadius   : 16,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  backToSyncBtn: {
    marginTop        : space.lg,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
    borderRadius     : 8,
    paddingVertical  : 10,
    paddingHorizontal: space.lg,
  },
})
