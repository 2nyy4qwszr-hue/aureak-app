import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase, listImplantations } from '@aureak/api-client'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Implantation } from '@aureak/types'

const PAGE_SIZE = 25

type SessionRow = {
  id             : string
  scheduledAt    : string
  durationMinutes: number
  status         : string
  location       : string | null
  implantationId : string
}

type StatusFilter = 'all' | 'planifiée' | 'en_cours' | 'terminée' | 'annulée'

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all',       label: 'Toutes'     },
  { key: 'planifiée', label: 'Planifiées' },
  { key: 'en_cours',  label: 'En cours'   },
  { key: 'terminée',  label: 'Terminées'  },
  { key: 'annulée',   label: 'Annulées'   },
]

const STATUS_LABEL: Record<string, string> = {
  planifiée: 'Planifiée',
  en_cours : 'En cours',
  terminée : 'Terminée',
  annulée  : 'Annulée',
}
const STATUS_VARIANT: Record<string, 'gold' | 'present' | 'zinc' | 'attention'> = {
  planifiée: 'gold',
  en_cours : 'present',
  terminée : 'zinc',
  annulée  : 'attention',
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}
function fmtTime(date: string) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ── Pagination ─────────────────────────────────────────────────────────────
function Pagination({
  page, total, onPrev, onNext,
}: { page: number; total: number; onPrev: () => void; onNext: () => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1
  const start = page * PAGE_SIZE + 1
  const end   = Math.min((page + 1) * PAGE_SIZE, total)
  return (
    <View style={pag.row}>
      <AureakText variant="caption" style={{ color: colors.text.secondary }}>
        {total > 0 ? `${start}–${end} sur ${total}` : '0 résultat'}
      </AureakText>
      <View style={pag.btnRow}>
        <Pressable
          style={[pag.btn, page === 0 && pag.btnDisabled]}
          onPress={onPrev}
          disabled={page === 0}
        >
          <AureakText variant="caption" style={{ color: page === 0 ? colors.text.secondary : colors.text.primary }}>
            ←
          </AureakText>
        </Pressable>
        <AureakText variant="caption" style={{ color: colors.text.secondary, paddingHorizontal: space.sm }}>
          {page + 1} / {totalPages}
        </AureakText>
        <Pressable
          style={[pag.btn, end >= total && pag.btnDisabled]}
          onPress={onNext}
          disabled={end >= total}
        >
          <AureakText variant="caption" style={{ color: end >= total ? colors.text.secondary : colors.text.primary }}>
            →
          </AureakText>
        </Pressable>
      </View>
    </View>
  )
}
const pag = StyleSheet.create({
  row       : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: space.sm },
  btnRow    : { flexDirection: 'row', alignItems: 'center' },
  btn       : { width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: colors.accent.zinc, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.surface },
  btnDisabled: { opacity: 0.35 },
})

// ── Main page ──────────────────────────────────────────────────────────────
export default function SessionsPage() {
  const router = useRouter()

  const [sessions,       setSessions]       = useState<SessionRow[]>([])
  const [implantations,  setImplantations]  = useState<Implantation[]>([])
  const [total,          setTotal]          = useState(0)
  const [page,           setPage]           = useState(0)
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('all')
  const [loading,        setLoading]        = useState(true)

  // Default: past 30 days + next 60 days
  const [from] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [to] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 60)
    return d.toISOString().split('T')[0]
  })

  const load = async () => {
    setLoading(true)
    let query = supabase
      .from('sessions')
      .select('id, scheduled_at, duration_minutes, status, location, implantation_id', { count: 'exact' })
      .gte('scheduled_at', new Date(from + 'T00:00:00').toISOString())
      .lte('scheduled_at', new Date(to + 'T23:59:59').toISOString())
      .order('scheduled_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, count } = await query

    const rows: SessionRow[] = ((data ?? []) as {
      id: string; scheduled_at: string; duration_minutes: number
      status: string; location: string | null; implantation_id: string
    }[]).map(r => ({
      id             : r.id,
      scheduledAt    : r.scheduled_at,
      durationMinutes: r.duration_minutes,
      status         : r.status,
      location       : r.location,
      implantationId : r.implantation_id,
    }))

    setSessions(rows)
    setTotal(count ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, statusFilter])

  // Reset page when filter changes
  useEffect(() => { setPage(0) }, [statusFilter])

  useEffect(() => {
    listImplantations().then(r => setImplantations(r.data))
  }, [])

  const implantName = (id: string) =>
    implantations.find(i => i.id === id)?.name ?? id.slice(0, 8) + '…'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Header ── */}
      <View style={styles.pageHeader}>
        <View>
          <AureakText variant="h2">Séances</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 2 }}>
              {total} séance{total !== 1 ? 's' : ''}
            </AureakText>
          )}
        </View>
        <Pressable
          style={styles.newBtn}
          onPress={() => router.push('/sessions/new' as never)}
        >
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            + Nouvelle séance
          </AureakText>
        </Pressable>
      </View>

      {/* ── Status tabs ── */}
      <View style={styles.tabRow}>
        {STATUS_TABS.map(tab => (
          <Pressable
            key={tab.key}
            style={[styles.tab, statusFilter === tab.key && styles.tabActive]}
            onPress={() => setStatusFilter(tab.key)}
          >
            <AureakText
              variant="caption"
              style={{
                color     : statusFilter === tab.key ? colors.accent.gold : colors.text.secondary,
                fontWeight: statusFilter === tab.key ? '700' : '400',
              }}
            >
              {tab.label}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {/* ── Table ── */}
      {loading ? (
        <View style={styles.skeletonBox}>
          {[0,1,2,3,4,5].map(i => <View key={i} style={styles.skeletonRow} />)}
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.secondary }}>Aucune séance</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 4 }}>
            Aucune séance ne correspond aux critères sélectionnés.
          </AureakText>
        </View>
      ) : (
        <View style={styles.table}>
          {/* Table header */}
          <View style={styles.thead}>
            <AureakText variant="caption" style={[styles.th, { flex: 2 }] as never}>Date</AureakText>
            <AureakText variant="caption" style={[styles.th, { width: 60 }] as never}>Heure</AureakText>
            <AureakText variant="caption" style={[styles.th, { width: 70 }] as never}>Durée</AureakText>
            <AureakText variant="caption" style={[styles.th, { flex: 2 }] as never}>Implantation</AureakText>
            <AureakText variant="caption" style={[styles.th, { width: 100 }] as never}>Statut</AureakText>
            <AureakText variant="caption" style={[styles.th, { width: 80, textAlign: 'right' }] as never}>Actions</AureakText>
          </View>

          {sessions.map((s, idx) => (
            <View key={s.id} style={[styles.tr, idx % 2 === 1 && styles.trAlt]}>
              <AureakText variant="body" style={[styles.td, { flex: 2, fontWeight: '600' }] as never}>
                {fmt(s.scheduledAt)}
              </AureakText>
              <AureakText variant="caption" style={[styles.td, { width: 60, color: colors.text.secondary }] as never}>
                {fmtTime(s.scheduledAt)}
              </AureakText>
              <AureakText variant="caption" style={[styles.td, { width: 70, color: colors.text.secondary }] as never}>
                {s.durationMinutes} min
              </AureakText>
              <AureakText variant="caption" style={[styles.td, { flex: 2, color: colors.text.secondary }] as never}>
                {implantName(s.implantationId)}
              </AureakText>
              <View style={[styles.td, { width: 100 }]}>
                <Badge
                  label={STATUS_LABEL[s.status] ?? s.status}
                  variant={STATUS_VARIANT[s.status] ?? 'zinc'}
                />
              </View>
              <View style={[styles.td, { width: 80, alignItems: 'flex-end' }]}>
                <Pressable
                  style={styles.manageBtn}
                  onPress={() => router.push(`/sessions/${s.id}` as never)}
                >
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 11 }}>
                    Gérer
                  </AureakText>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Pagination ── */}
      {!loading && total > PAGE_SIZE && (
        <Pagination
          page={page}
          total={total}
          onPrev={() => setPage(p => Math.max(0, p - 1))}
          onNext={() => setPage(p => p + 1)}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.background.primary },
  content    : { padding: space.xl, gap: space.md },
  pageHeader : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  newBtn     : {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius   : 7,
  },
  tabRow     : {
    flexDirection  : 'row',
    gap            : space.xs,
    flexWrap       : 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.zinc,
    paddingBottom  : space.sm,
  },
  tab        : {
    paddingHorizontal: space.sm + 2,
    paddingVertical: 5,
    borderRadius   : 5,
  },
  tabActive  : { backgroundColor: colors.background.elevated },
  table      : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    overflow       : 'hidden',
  },
  thead      : {
    flexDirection  : 'row',
    alignItems     : 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.zinc,
    backgroundColor: colors.background.elevated,
  },
  th         : {
    color          : colors.text.secondary,
    fontWeight     : '700',
    letterSpacing  : 0.8,
    textTransform  : 'uppercase',
    fontSize       : 10,
  },
  tr         : {
    flexDirection  : 'row',
    alignItems     : 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.zinc,
  },
  trAlt      : { backgroundColor: colors.background.elevated },
  td         : { paddingRight: space.sm },
  manageBtn  : {
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius   : 5,
    borderWidth    : 1,
    borderColor    : colors.accent.gold,
  },
  skeletonBox : { gap: space.xs },
  skeletonRow : {
    height         : 48,
    backgroundColor: colors.background.surface,
    borderRadius   : 6,
    opacity        : 0.5,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
  },
  emptyState  : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
  },
})
