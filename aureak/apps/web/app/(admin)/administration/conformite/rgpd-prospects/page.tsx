// Story 89.3 — Page admin RGPD : demandes d'accès coordonnées prospects
// Story 99.5 — AdminPageHeader v2 ("RGPD prospects")
// 3 onglets :
//   - Demandes en attente  (actions Approuver / Rejeter)
//   - Grants actifs        (action Révoquer)
//   - Historique           (log immuable des accès démasqués)
//
// Gate : admin uniquement (RLS de toute façon). Affichage "Accès refusé" si pas admin.
'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Pressable, ScrollView, StyleSheet, TextInput, Modal } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { AdminPageHeader } from '../../../../../components/admin/AdminPageHeader'
import {
  listRgpdAccessRequests,
  resolveRgpdAccessRequest,
  listRgpdGrants,
  revokeRgpdGrant,
  listRgpdAccessLog,
} from '@aureak/api-client'
import type {
  ProspectAccessRequestWithMeta,
  ProspectAccessGrantWithMeta,
  ProspectRgpdAccessLogWithMeta,
  RgpdGrantReason,
} from '@aureak/types'
import { useAuthStore } from '@aureak/business-logic'
import { useToast } from '../../../../../components/ToastContext'

type Tab = 'pending' | 'grants' | 'log'

const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Demandes en attente' },
  { key: 'grants',  label: 'Grants actifs'       },
  { key: 'log',     label: 'Historique'          },
]

const GRANT_REASON_LABEL: Record<RgpdGrantReason, string> = {
  creator         : 'Créateur',
  invitation      : 'Invitation',
  evaluation      : 'Évaluation',
  explicit_grant  : 'Grant manuel',
  admin           : 'Admin (bypass)',
  request_approved: 'Demande approuvée',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('fr-BE', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function ProspectAccessAdminPage() {
  const role                       = useAuthStore(s => s.role)
  const toast                      = useToast()

  const [tab, setTab]              = useState<Tab>('pending')
  const [loading, setLoading]      = useState(true)
  const [error, setError]          = useState<string | null>(null)

  const [requests, setRequests]    = useState<ProspectAccessRequestWithMeta[]>([])
  const [grants, setGrants]        = useState<ProspectAccessGrantWithMeta[]>([])
  const [log, setLog]              = useState<ProspectRgpdAccessLogWithMeta[]>([])

  // Modal de résolution de demande
  const [resolveState, setResolveState] = useState<{
    request : ProspectAccessRequestWithMeta | null
    decision: 'approved' | 'rejected' | null
  }>({ request: null, decision: null })
  const [note, setNote]               = useState('')
  const [resolving, setResolving]     = useState(false)

  // Modal de révocation de grant
  const [grantToRevoke, setGrantToRevoke] = useState<ProspectAccessGrantWithMeta | null>(null)
  const [revoking, setRevoking]           = useState(false)

  const isAdmin = role === 'admin'

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (tab === 'pending') {
        const rows = await listRgpdAccessRequests({ status: 'pending' })
        setRequests(rows)
      } else if (tab === 'grants') {
        const rows = await listRgpdGrants()
        setGrants(rows)
      } else {
        const rows = await listRgpdAccessLog()
        setLog(rows)
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[ProspectAccessAdminPage] load error:', err)
      }
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    if (!isAdmin) return
    loadAll()
  }, [loadAll, isAdmin])

  const openResolve = useCallback((request: ProspectAccessRequestWithMeta, decision: 'approved' | 'rejected') => {
    setResolveState({ request, decision })
    setNote('')
  }, [])

  const closeResolve = useCallback(() => {
    if (resolving) return
    setResolveState({ request: null, decision: null })
    setNote('')
  }, [resolving])

  const handleResolve = useCallback(async () => {
    if (!resolveState.request || !resolveState.decision) return
    setResolving(true)
    try {
      await resolveRgpdAccessRequest(
        resolveState.request.id,
        resolveState.decision,
        note.trim() || undefined,
      )
      toast.success(
        resolveState.decision === 'approved'
          ? 'Demande approuvée — grant créé.'
          : 'Demande rejetée.',
      )
      closeResolve()
      await loadAll()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[ProspectAccessAdminPage] resolve error:', err)
      }
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setResolving(false)
    }
  }, [resolveState, note, toast, closeResolve, loadAll])

  const handleRevoke = useCallback(async () => {
    if (!grantToRevoke) return
    setRevoking(true)
    try {
      await revokeRgpdGrant(grantToRevoke.id)
      toast.success('Grant révoqué.')
      setGrantToRevoke(null)
      await loadAll()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[ProspectAccessAdminPage] revoke error:', err)
      }
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setRevoking(false)
    }
  }, [grantToRevoke, toast, loadAll])

  // ─── Gate admin ───────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        <View style={st.denied}>
          <AureakText style={st.deniedTitle as never}>Accès refusé</AureakText>
          <AureakText style={st.deniedSub as never}>
            Cette page est réservée aux administrateurs.
          </AureakText>
        </View>
      </ScrollView>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.light.primary }}>
      {/* Story 99.5 — AdminPageHeader v2 */}
      <AdminPageHeader title="RGPD prospects" />

      <ScrollView style={st.container} contentContainerStyle={st.content}>
      {/* Tabs */}
      <View style={st.tabs}>
        {TABS.map(t => (
          <Pressable
            key={t.key}
            style={[st.tab, tab === t.key && st.tabActive] as never}
            onPress={() => setTab(t.key)}
          >
            <AureakText
              style={[st.tabText, tab === t.key && st.tabTextActive] as never}
            >
              {t.label}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {error && (
        <View style={st.errorBanner}>
          <AureakText style={{ color: colors.accent.red, fontSize: 12 }}>{error}</AureakText>
        </View>
      )}

      {loading && (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</AureakText>
      )}

      {/* ─── Onglet demandes ─────────────────────────────────────────────── */}
      {!loading && tab === 'pending' && (
        <View style={st.tableWrapper}>
          <View style={st.tableHeader}>
            <View style={{ flex: 1.2 }}><AureakText style={st.th as never}>DEMANDEUR</AureakText></View>
            <View style={{ flex: 1.2 }}><AureakText style={st.th as never}>PROSPECT</AureakText></View>
            <View style={{ flex: 2   }}><AureakText style={st.th as never}>MOTIF</AureakText></View>
            <View style={{ width: 140 }}><AureakText style={st.th as never}>DEMANDÉ LE</AureakText></View>
            <View style={{ width: 180 }}><AureakText style={st.th as never}>ACTIONS</AureakText></View>
          </View>

          {requests.length === 0 ? (
            <View style={st.empty}>
              <AureakText style={st.emptyText as never}>Aucune demande en attente.</AureakText>
            </View>
          ) : requests.map((r, idx) => (
            <View
              key={r.id}
              style={[st.tableRow, { backgroundColor: idx % 2 === 0 ? colors.light.surface : colors.light.muted }] as never}
            >
              <View style={{ flex: 1.2 }}>
                <AureakText style={st.cellName as never}>{r.requesterName ?? r.requesterEmail ?? '—'}</AureakText>
                <AureakText style={st.cellSub as never}>{r.requesterEmail ?? ''}</AureakText>
              </View>
              <AureakText style={[st.cellText, { flex: 1.2 }] as never}>{r.childName}</AureakText>
              <AureakText style={[st.cellText, { flex: 2 }] as never} numberOfLines={3}>
                {r.reason}
              </AureakText>
              <AureakText style={[st.cellMuted, { width: 140 }] as never}>
                {formatDate(r.requestedAt)}
              </AureakText>
              <View style={[st.actionsCell, { width: 180 }]}>
                <Pressable
                  style={st.btnApprove}
                  onPress={() => openResolve(r, 'approved')}
                >
                  <AureakText style={st.btnApproveText as never}>Approuver</AureakText>
                </Pressable>
                <Pressable
                  style={st.btnReject}
                  onPress={() => openResolve(r, 'rejected')}
                >
                  <AureakText style={st.btnRejectText as never}>Rejeter</AureakText>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ─── Onglet grants ───────────────────────────────────────────────── */}
      {!loading && tab === 'grants' && (
        <>
          <AureakText style={st.infoNote as never}>
            Les grants auto ({GRANT_REASON_LABEL.creator}, {GRANT_REASON_LABEL.invitation}, {GRANT_REASON_LABEL.evaluation})
            sont réinstaurés automatiquement si l'événement déclencheur se répète.
          </AureakText>
          <View style={st.tableWrapper}>
            <View style={st.tableHeader}>
              <View style={{ flex: 1.2 }}><AureakText style={st.th as never}>BÉNÉFICIAIRE</AureakText></View>
              <View style={{ flex: 1.2 }}><AureakText style={st.th as never}>PROSPECT</AureakText></View>
              <View style={{ width: 160 }}><AureakText style={st.th as never}>MOTIF</AureakText></View>
              <View style={{ width: 140 }}><AureakText style={st.th as never}>ACCORDÉ LE</AureakText></View>
              <View style={{ width: 120 }}><AureakText style={st.th as never}>ACTIONS</AureakText></View>
            </View>

            {grants.length === 0 ? (
              <View style={st.empty}>
                <AureakText style={st.emptyText as never}>Aucun grant actif.</AureakText>
              </View>
            ) : grants.map((g, idx) => (
              <View
                key={g.id}
                style={[st.tableRow, { backgroundColor: idx % 2 === 0 ? colors.light.surface : colors.light.muted }] as never}
              >
                <View style={{ flex: 1.2 }}>
                  <AureakText style={st.cellName as never}>{g.grantedToName ?? g.grantedToEmail ?? '—'}</AureakText>
                  <AureakText style={st.cellSub as never}>{g.grantedToEmail ?? ''}</AureakText>
                </View>
                <AureakText style={[st.cellText, { flex: 1.2 }] as never}>{g.childName}</AureakText>
                <AureakText style={[st.cellText, { width: 160 }] as never}>
                  {GRANT_REASON_LABEL[g.reason]}
                </AureakText>
                <AureakText style={[st.cellMuted, { width: 140 }] as never}>
                  {formatDate(g.grantedAt)}
                </AureakText>
                <View style={{ width: 120 }}>
                  <Pressable
                    style={st.btnReject}
                    onPress={() => setGrantToRevoke(g)}
                  >
                    <AureakText style={st.btnRejectText as never}>Révoquer</AureakText>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ─── Onglet log ──────────────────────────────────────────────────── */}
      {!loading && tab === 'log' && (
        <View style={st.tableWrapper}>
          <View style={st.tableHeader}>
            <View style={{ flex: 1.2 }}><AureakText style={st.th as never}>ACCESSEUR</AureakText></View>
            <View style={{ flex: 1.2 }}><AureakText style={st.th as never}>PROSPECT</AureakText></View>
            <View style={{ width: 160 }}><AureakText style={st.th as never}>VIA</AureakText></View>
            <View style={{ width: 180 }}><AureakText style={st.th as never}>ACCÈS</AureakText></View>
          </View>

          {log.length === 0 ? (
            <View style={st.empty}>
              <AureakText style={st.emptyText as never}>Aucun accès enregistré.</AureakText>
            </View>
          ) : log.map((l, idx) => (
            <View
              key={l.id}
              style={[st.tableRow, { backgroundColor: idx % 2 === 0 ? colors.light.surface : colors.light.muted }] as never}
            >
              <View style={{ flex: 1.2 }}>
                <AureakText style={st.cellName as never}>{l.accessorName ?? l.accessorEmail ?? '—'}</AureakText>
                <AureakText style={st.cellSub as never}>{l.accessorEmail ?? ''}</AureakText>
              </View>
              <AureakText style={[st.cellText, { flex: 1.2 }] as never}>{l.childName}</AureakText>
              <AureakText style={[st.cellText, { width: 160 }] as never}>
                {GRANT_REASON_LABEL[l.grantedVia]}
              </AureakText>
              <AureakText style={[st.cellMuted, { width: 180 }] as never}>
                {formatDate(l.accessedAt)}
              </AureakText>
            </View>
          ))}
        </View>
      )}

      {/* ─── Modal résolution ────────────────────────────────────────────── */}
      <Modal
        visible={resolveState.request !== null}
        transparent
        animationType="fade"
        onRequestClose={closeResolve}
      >
        <View style={st.backdrop}>
          <View style={st.modalCard}>
            <View style={st.modalHeader}>
              <AureakText style={st.modalTitle as never}>
                {resolveState.decision === 'approved' ? 'Approuver la demande' : 'Rejeter la demande'}
              </AureakText>
              <AureakText style={st.modalSub as never}>
                {resolveState.request?.requesterName ?? resolveState.request?.requesterEmail ?? '—'}
                {' → '}
                {resolveState.request?.childName ?? ''}
              </AureakText>
            </View>

            <View style={st.modalBody}>
              <AureakText style={st.modalLabel as never}>Note (optionnelle)</AureakText>
              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={500}
                placeholder="Motif de la décision…"
                style={st.textarea as never}
                editable={!resolving}
              />
            </View>

            <View style={st.modalFooter}>
              <Pressable
                style={st.btnCancel}
                onPress={closeResolve}
                disabled={resolving}
              >
                <AureakText style={st.btnCancelText as never}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[
                  resolveState.decision === 'approved' ? st.btnApproveLg : st.btnRejectLg,
                  resolving && { opacity: 0.5 },
                ] as never}
                onPress={handleResolve}
                disabled={resolving}
              >
                <AureakText
                  style={resolveState.decision === 'approved' ? st.btnApproveText as never : st.btnRejectText as never}
                >
                  {resolving ? 'Traitement…' : (resolveState.decision === 'approved' ? 'Approuver' : 'Rejeter')}
                </AureakText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Modal révocation ────────────────────────────────────────────── */}
      <Modal
        visible={grantToRevoke !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !revoking && setGrantToRevoke(null)}
      >
        <View style={st.backdrop}>
          <View style={st.modalCard}>
            <View style={st.modalHeader}>
              <AureakText style={st.modalTitle as never}>Révoquer le grant</AureakText>
              <AureakText style={st.modalSub as never}>
                {grantToRevoke?.grantedToName ?? grantToRevoke?.grantedToEmail ?? '—'}
                {' → '}
                {grantToRevoke?.childName ?? ''}
              </AureakText>
            </View>
            <View style={st.modalBody}>
              <AureakText style={{ fontSize: 13, color: colors.text.dark, lineHeight: 20 }}>
                Le bénéficiaire n'aura plus accès aux coordonnées parent de ce prospect. Cette action
                est soft-delete (deleted_at). Un grant automatique peut être réinstauré si
                l'utilisateur effectue à nouveau l'action déclencheuse.
              </AureakText>
            </View>
            <View style={st.modalFooter}>
              <Pressable
                style={st.btnCancel}
                onPress={() => !revoking && setGrantToRevoke(null)}
                disabled={revoking}
              >
                <AureakText style={st.btnCancelText as never}>Annuler</AureakText>
              </Pressable>
              <Pressable
                style={[st.btnRejectLg, revoking && { opacity: 0.5 }] as never}
                onPress={handleRevoke}
                disabled={revoking}
              >
                <AureakText style={st.btnRejectText as never}>
                  {revoking ? 'Révocation…' : 'Révoquer'}
                </AureakText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },

  header: { gap: 6 },
  title : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },
  sub   : { color: colors.text.muted, fontSize: 13 },

  // Gate refusé
  denied: {
    padding        : space.xl,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : space.xs,
  },
  deniedTitle: { fontSize: 18, fontWeight: '700', color: colors.text.dark },
  deniedSub  : { fontSize: 13, color: colors.text.muted },

  // Tabs
  tabs: {
    flexDirection: 'row',
    gap          : space.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tab: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent.gold,
  },
  tabText     : { fontSize: 13, color: colors.text.muted, fontWeight: '600' },
  tabTextActive: { color: colors.text.dark, fontWeight: '700' },

  infoNote: {
    fontSize : 12,
    color    : colors.text.subtle,
    fontStyle: 'italic',
  },

  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.red,
    padding        : space.sm,
    borderRadius   : radius.xs,
  },

  // Table
  tableWrapper: {
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    overflow       : 'hidden',
    backgroundColor: colors.light.surface,
    // @ts-ignore
    boxShadow      : shadows.sm,
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.md,
  },
  th: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.md,
  },
  cellName : { color: colors.text.dark, fontSize: 13, fontWeight: '600' },
  cellSub  : { color: colors.text.muted, fontSize: 11, marginTop: 2 },
  cellText : { color: colors.text.dark, fontSize: 13 },
  cellMuted: { color: colors.text.muted, fontSize: 12 },

  actionsCell: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  btnApprove: {
    paddingHorizontal: 10,
    paddingVertical  : 6,
    borderRadius     : radius.xs,
    backgroundColor  : colors.status.present,
  },
  btnReject: {
    paddingHorizontal: 10,
    paddingVertical  : 6,
    borderRadius     : radius.xs,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.accent.red,
  },
  btnApproveText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  btnRejectText : { color: colors.accent.red, fontSize: 11, fontWeight: '700' },

  // Modal
  backdrop: {
    flex           : 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.lg,
  },
  modalCard: {
    width          : '100%',
    maxWidth       : 520,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    // @ts-ignore
    boxShadow      : shadows.lg,
    overflow       : 'hidden',
  },
  modalHeader: {
    padding          : space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : 4,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text.dark },
  modalSub  : { fontSize: 13, color: colors.text.muted },
  modalBody : { padding: space.lg, gap: space.sm },
  modalLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    color        : colors.text.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textarea: {
    minHeight        : 100,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    backgroundColor  : '#FFFFFF',
    padding          : space.sm,
    fontSize         : 14,
    color            : colors.text.dark,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection    : 'row',
    justifyContent   : 'flex-end',
    gap              : space.sm,
    padding          : space.lg,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
    backgroundColor  : colors.light.muted,
  },
  btnCancel: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  btnCancelText: { fontSize: 13, color: colors.text.dark, fontWeight: '600' },
  btnApproveLg: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.button,
    backgroundColor  : colors.status.present,
  },
  btnRejectLg: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.accent.red,
  },

  empty: {
    padding   : space.xl,
    alignItems: 'center',
  },
  emptyText: { color: colors.text.muted, fontSize: 13, fontStyle: 'italic' },
})
