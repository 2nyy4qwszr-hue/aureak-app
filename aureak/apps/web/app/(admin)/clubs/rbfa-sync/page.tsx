import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import {
  syncMissingClubLogos,
  resetAllClubsForSync,
  getClubRbfaStats,
} from '@aureak/api-client'
import type { RbfaStats } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { SyncResult } from '@aureak/types'

// ── Composant carte statistique ───────────────────────────────────────────────

function StatCard({
  label, count, color,
}: { label: string; count: number; color: string }) {
  return (
    <View style={[sc.card, { borderLeftColor: color }]}>
      <AureakText variant="h2" style={{ color, fontWeight: '800' }}>{count}</AureakText>
      <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>{label}</AureakText>
    </View>
  )
}
const sc = StyleSheet.create({
  card: {
    flex           : 1,
    minWidth       : 120,
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderLeftWidth: 4,
    padding        : space.md,
    elevation: 1,
  },
})

// ── Composant carte résultat import ──────────────────────────────────────────

function ResultCard({
  label, count, color, icon,
}: { label: string; count: number; color: string; icon: string }) {
  return (
    <View style={[rc.card, { borderColor: color }]}>
      <AureakText style={{ fontSize: 24, marginBottom: 4 }}>{icon}</AureakText>
      <AureakText variant="h2" style={{ color, fontWeight: '800' }}>{count}</AureakText>
      <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2, textAlign: 'center' }}>
        {label}
      </AureakText>
    </View>
  )
}
const rc = StyleSheet.create({
  card: {
    flex           : 1,
    minWidth       : 130,
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderWidth    : 1.5,
    padding        : space.md,
    alignItems     : 'center',
    elevation: 1,
  },
})

// ── Page principale ───────────────────────────────────────────────────────────

export default function RbfaSyncPage() {
  const router   = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)

  const [stats,       setStats]       = useState<RbfaStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [syncing,     setSyncing]     = useState(false)
  const [result,      setResult]      = useState<SyncResult | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const loadStats = useCallback(async () => {
    if (!tenantId) return
    setStatsLoading(true)
    try {
      const { data } = await getClubRbfaStats(tenantId)
      setStats(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[rbfa-sync] loadStats error:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [tenantId])

  useEffect(() => { loadStats() }, [loadStats])

  const handleSync = async () => {
    if (!tenantId) return
    setSyncing(true)
    setResult(null)
    setError(null)
    try {
      const res = await syncMissingClubLogos(tenantId)
      setResult(res)
      await loadStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSyncing(false)
    }
  }

  const handleResetAndSync = async () => {
    if (!tenantId) return
    setShowConfirm(false)
    setSyncing(true)
    setResult(null)
    setError(null)
    try {
      await resetAllClubsForSync(tenantId)
      const res = await syncMissingClubLogos(tenantId)
      setResult(res)
      await loadStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Retour clubs</AureakText>
        </Pressable>
        <AureakText variant="h2" color={colors.accent.gold}>Import logos RBFA</AureakText>
        <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
          Recherche et importe automatiquement les logos de clubs depuis rbfa.be
        </AureakText>
      </View>

      {/* Stats actuelles */}
      <View style={s.section}>
        <AureakText variant="h3" style={{ color: colors.text.dark, marginBottom: space.md }}>
          État actuel
        </AureakText>
        {statsLoading ? (
          <AureakText variant="caption" style={{ color: colors.text.muted }}>Chargement…</AureakText>
        ) : stats ? (
          <>
            <View style={s.statsRow}>
              <StatCard label="En attente"  count={stats.pending}  color={colors.accent.gold} />
              <StatCard label="Matchés"     count={stats.matched}  color={colors.status.success} />
              <StatCard label="Rejetés"     count={stats.rejected} color={colors.accent.red} />
              <StatCard label="Sans résultat" count={stats.skipped} color={colors.text.muted} />
            </View>
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: space.sm }}>
              Total : {stats.total} clubs
            </AureakText>
          </>
        ) : null}
      </View>

      {/* Actions */}
      <View style={s.section}>
        <AureakText variant="h3" style={{ color: colors.text.dark, marginBottom: space.md }}>
          Actions
        </AureakText>

        <View style={s.actionsRow}>
          {/* Bouton principal : lancer l'import */}
          <Pressable
            style={[s.primaryBtn, syncing && s.btnDisabled]}
            onPress={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <AureakText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
                Import en cours…
              </AureakText>
            ) : (
              <AureakText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
                Lancer l'import
              </AureakText>
            )}
          </Pressable>

          {/* Bouton secondaire : relancer tout */}
          <Pressable
            style={[s.secondaryBtn, syncing && s.btnDisabled]}
            onPress={() => setShowConfirm(true)}
            disabled={syncing}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' }}>
              Relancer tout (rejected + skipped)
            </AureakText>
          </Pressable>
        </View>

        <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: space.sm }}>
          "Lancer l'import" traite uniquement les clubs en attente (pending + jamais traités).{'\n'}
          "Relancer tout" remet en file les clubs rejetés, sans résultat et jamais traités.{'\n'}
          Les clubs déjà matchés ne sont jamais retouchés.
        </AureakText>

        <Pressable
          style={s.reviewBtn}
          onPress={() => router.push('/clubs/rbfa-sync/reviews' as never)}
        >
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '600' }}>
            Voir les matchings à valider manuellement →
          </AureakText>
        </Pressable>
      </View>

      {/* Erreur */}
      {error && (
        <View style={s.errorBox}>
          <AureakText variant="caption" style={{ color: colors.accent.red }}>
            Erreur : {error}
          </AureakText>
        </View>
      )}

      {/* Résultats */}
      {result && (
        <View style={s.section}>
          <AureakText variant="h3" style={{ color: colors.text.dark, marginBottom: space.md }}>
            Résultats de l'import
          </AureakText>
          <View style={s.resultsRow}>
            <ResultCard label="Traités"       count={result.processed}     color={colors.text.dark}         icon="📋" />
            <ResultCard label="Matchés"       count={result.matched}       color={colors.status.success}    icon="✅" />
            <ResultCard label="À valider"     count={result.pendingReview} color={colors.accent.goldLight}  icon="⏳" />
            <ResultCard label="Rejetés"       count={result.rejected}      color={colors.accent.red}        icon="❌" />
            <ResultCard label="Sans résultat" count={result.skipped}       color={colors.text.muted}        icon="⏭️" />
            <ResultCard label="Erreurs"       count={result.errors}        color={colors.accent.red}        icon="⚠️" />
          </View>
          {result.pendingReview > 0 && (
            <Pressable style={s.reviewNote} onPress={() => router.push('/clubs/rbfa-sync/reviews' as never)}>
              <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' }}>
                {result.pendingReview} club{result.pendingReview > 1 ? 's' : ''} à valider manuellement →
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
                Score intermédiaire (25–54). Appuyez pour ouvrir la page de review.
              </AureakText>
            </Pressable>
          )}
        </View>
      )}

      {/* Modal confirmation "Relancer tout" */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <AureakText variant="h3" style={{ color: colors.text.dark, marginBottom: space.sm }}>
              Relancer l'import complet ?
            </AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: space.lg }}>
              Cela remettra en file d'attente tous les clubs rejetés, sans résultat et jamais traités, puis lancera l'import.
              Les clubs déjà matchés (logo validé) ne seront pas retouchés.
            </AureakText>
            <View style={s.modalBtns}>
              <Pressable style={s.cancelBtn} onPress={() => setShowConfirm(false)}>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
              </Pressable>
              <Pressable style={s.confirmBtn} onPress={handleResetAndSync}>
                <AureakText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>Confirmer</AureakText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.lg, gap: space.lg },
  header    : { gap: 4 },
  backBtn   : { marginBottom: space.sm },
  section   : {
    backgroundColor: colors.light.surface,
    borderRadius   : 16,
    padding        : space.lg,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    elevation: 1,
  },
  statsRow  : { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.sm },
  resultsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  primaryBtn: {
    backgroundColor: colors.accent.gold,
    borderRadius   : 10,
    paddingVertical: 12,
    paddingHorizontal: space.lg,
  },
  secondaryBtn: {
    backgroundColor: colors.light.elevated,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    paddingVertical: 12,
    paddingHorizontal: space.lg,
  },
  btnDisabled: { opacity: 0.5 },
  errorBox  : {
    backgroundColor: '#FEF2F2',
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.accent.red,
    padding        : space.md,
  },
  reviewNote: {
    backgroundColor: '#FFFBEB',
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.accent.goldLight,
    padding        : space.md,
    marginTop      : space.md,
  },
  reviewBtn : {
    marginTop        : space.md,
    paddingVertical  : 10,
    paddingHorizontal: space.md,
    borderRadius     : 8,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
    alignSelf        : 'flex-start',
  },
  modalOverlay: {
    flex           : 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems     : 'center',
    justifyContent : 'center',
  },
  modalBox  : {
    backgroundColor: colors.light.surface,
    borderRadius   : 16,
    padding        : space.lg,
    maxWidth       : 420,
    width          : '90%',
    elevation: 4,
  },
  modalBtns : { flexDirection: 'row', justifyContent: 'flex-end', gap: space.md },
  cancelBtn : {
    paddingVertical  : 10,
    paddingHorizontal: space.md,
    borderRadius     : 8,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  confirmBtn: {
    backgroundColor  : colors.accent.gold,
    paddingVertical  : 10,
    paddingHorizontal: space.md,
    borderRadius     : 8,
  },
})
