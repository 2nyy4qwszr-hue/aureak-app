'use client'
// Story 63.2 — Page Évènements unifiée (Stages + Tournois + Fun Day + Detect Day + Séminaires)
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { listEvents } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import type { StageWithMeta, StageStatus, EventType } from '@aureak/types'
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '@aureak/types'
import { SkeletonCard } from '../../../components/SkeletonCard'

// ============================================================
// Constantes de design
// ============================================================

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bg: string }> = {
  stage      : { label: 'Stage',              color: colors.accent.gold,    bg: colors.accent.gold    + '1f' },
  tournoi    : { label: 'Tournoi Goal à Goal', color: colors.entity.club,   bg: colors.entity.club    + '1f' },
  fun_day    : { label: 'Fun Day',             color: colors.status.success, bg: colors.status.success + '1f' },
  detect_day : { label: 'Detect Day',          color: colors.accent.red,    bg: colors.accent.red     + '1f' },
  seminaire  : { label: 'Séminaire',           color: colors.text.subtle,   bg: colors.text.subtle    + '1f' },
}

const STATUS_COLORS: Record<StageStatus, string> = {
  planifié : colors.accent.gold,
  en_cours : colors.entity.stage,
  terminé  : colors.text.muted,
  annulé   : colors.accent.red,
}

// ============================================================
// Helpers
// ============================================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ============================================================
// Composants locaux
// ============================================================

function EventTypePill({ eventType }: { eventType: EventType }) {
  const cfg = EVENT_TYPE_CONFIG[eventType]
  return (
    <View style={[s.pill, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
      <Text style={[s.pillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  )
}

function StatusBadge({ status }: { status: StageStatus }) {
  const color = STATUS_COLORS[status]
  return (
    <View style={{ backgroundColor: color + '20', borderColor: color, borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 2 }}>
      <Text style={{ color, fontWeight: '700', fontSize: 10 }}>
        {status.toUpperCase()}
      </Text>
    </View>
  )
}

function EventCard({ event, onPress }: { event: StageWithMeta; onPress: () => void }) {
  return (
    <Pressable style={s.card} onPress={onPress}>
      {/* Bande de couleur par statut */}
      <View style={[s.cardAccent, { backgroundColor: STATUS_COLORS[event.status] }]} />

      <View style={{ padding: space.md, gap: space.xs }}>
        {/* Titre + type pill (coin supérieur droit) */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.xs }}>
          <AureakText variant="body" style={{ fontWeight: '700', flex: 1, fontSize: 14 }}>
            {event.name}
          </AureakText>
          <EventTypePill eventType={event.eventType} />
        </View>

        {/* Statut */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          <StatusBadge status={event.status} />
        </View>

        {/* Implantation */}
        {event.implantationName && (
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            📍 {event.implantationName}
          </AureakText>
        )}

        {/* Dates */}
        <View style={s.chip}>
          <AureakText variant="caption" style={{ fontSize: 11 }}>
            {formatDate(event.startDate)} → {formatDate(event.endDate)}
          </AureakText>
        </View>

        {/* Footer stats */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xs }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
              {event.dayCount} jour{event.dayCount !== 1 ? 's' : ''}
            </AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
              · {event.participantCount} joueur{event.participantCount !== 1 ? 's' : ''}
            </AureakText>
          </View>
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 11 }}>
            Voir →
          </AureakText>
        </View>
      </View>
    </Pressable>
  )
}

// ============================================================
// Modal sélection type pour "Nouvel évènement"
// ============================================================

function NewEventModal({ visible, onClose, onSelectType }: {
  visible     : boolean
  onClose     : () => void
  onSelectType: (type: EventType) => void
}) {
  const [selected, setSelected] = useState<EventType | null>(null)

  const handleConfirm = () => {
    if (selected) onSelectType(selected)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.modalBox} onPress={e => e.stopPropagation()}>
          <AureakText variant="h3" style={{ marginBottom: space.md, color: colors.text.dark }}>
            Quel type d&apos;évènement ?
          </AureakText>

          {EVENT_TYPES.map(type => {
            const cfg = EVENT_TYPE_CONFIG[type]
            const isSelected = selected === type
            return (
              <Pressable
                key={type}
                style={[s.typeOption, isSelected && { borderColor: cfg.color, backgroundColor: cfg.bg }]}
                onPress={() => setSelected(type)}
              >
                <View style={[s.typeColorDot, { backgroundColor: cfg.color }]} />
                <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: isSelected ? '700' : '400' }}>
                  {cfg.label}
                </AureakText>
              </Pressable>
            )
          })}

          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
            <Pressable style={s.btnSecondary} onPress={onClose}>
              <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '600' }}>Annuler</AureakText>
            </Pressable>
            <Pressable
              style={[s.btnPrimary, !selected && { opacity: 0.45 }]}
              onPress={handleConfirm}
              disabled={!selected}
            >
              <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>Continuer</AureakText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ============================================================
// Page principale
// ============================================================

export default function EvenementsPage() {
  const router  = useRouter()
  const params  = useLocalSearchParams<{ type?: string }>()

  const activeType = useMemo(
    () => (params.type && (EVENT_TYPES as readonly string[]).includes(params.type) ? params.type as EventType : null),
    [params.type],
  )

  const [events,   setEvents]   = useState<StageWithMeta[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listEvents(activeType ? { type: activeType } : undefined)
      setEvents(data)
    } catch (err) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[evenements/page] load error:', err)
      setError('Impossible de charger les évènements.')
    } finally {
      setLoading(false)
    }
  }, [activeType])

  useEffect(() => { load() }, [load])

  const setFilter = useCallback((type: EventType | null) => {
    if (type) {
      router.replace(`/evenements?type=${type}` as never)
    } else {
      router.replace('/evenements' as never)
    }
  }, [router])

  const handleSelectEventType = useCallback((type: EventType) => {
    setShowModal(false)
    if (type === 'stage') {
      router.push('/stages/new' as never)
    } else {
      // Types non encore implémentés — stub message
      // La navigation reste sur /evenements avec le filtre du type sélectionné
      setFilter(type)
    }
  }, [router, setFilter])

  const handleCardPress = useCallback((event: StageWithMeta) => {
    // Pour tous les types actuels, la fiche détail est sous /stages/[id]
    router.push(`/stages/${event.id}` as never)
  }, [router])

  // Message "bientôt disponible" pour types non-stage
  const isStubType = activeType && activeType !== 'stage'
  const cfg = activeType ? EVENT_TYPE_CONFIG[activeType] : null

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Évènements</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
              {events.length} évènement{events.length !== 1 ? 's' : ''}
              {activeType ? ` · ${EVENT_TYPE_CONFIG[activeType].label}` : ''}
            </AureakText>
          )}
        </View>
        <Pressable style={s.newBtn} onPress={() => setShowModal(true)}>
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            + Nouvel évènement
          </AureakText>
        </Pressable>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.pillsScrollView}
        contentContainerStyle={s.pillsRow}
      >
        {/* Pill "Tous" */}
        <Pressable
          style={[s.filterPill, !activeType && s.filterPillActive]}
          onPress={() => setFilter(null)}
        >
          <Text style={[s.filterPillText, !activeType && s.filterPillTextActive]}>
            Tous
          </Text>
        </Pressable>

        {EVENT_TYPES.map(type => {
          const typeCfg = EVENT_TYPE_CONFIG[type]
          const isActive = activeType === type
          return (
            <Pressable
              key={type}
              style={[
                s.filterPill,
                isActive && { backgroundColor: typeCfg.bg, borderColor: typeCfg.color },
              ]}
              onPress={() => setFilter(type)}
            >
              <Text style={[s.filterPillText, isActive && { color: typeCfg.color, fontWeight: '700' }]}>
                {typeCfg.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Message stub pour types non encore implémentés */}
      {isStubType && cfg && (
        <View style={[s.stubBanner, { borderColor: cfg.color, backgroundColor: cfg.bg }]}>
          <AureakText variant="body" style={{ fontWeight: '700', color: cfg.color, marginBottom: 4 }}>
            {cfg.label} — Création bientôt disponible
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            La gestion des évènements de type « {cfg.label} » sera disponible dans une prochaine mise à jour.
          </AureakText>
        </View>
      )}

      {/* Error */}
      {error ? (
        <View style={{ backgroundColor: colors.accent.red + '1f', borderRadius: 7, padding: space.md, borderWidth: 1, borderColor: colors.accent.red }}>
          <AureakText variant="caption" style={{ color: colors.accent.red }}>{error}</AureakText>
        </View>
      ) : loading ? (
        /* Skeleton */
        <View style={s.grid}>
          {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} height={170} />)}
        </View>
      ) : events.length === 0 && !isStubType ? (
        /* Empty state */
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>📅</Text>
          <AureakText variant="body" style={{ fontWeight: '700', color: colors.text.dark, marginBottom: 4 }}>
            Aucun évènement
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center' }}>
            {activeType
              ? `Aucun évènement de type « ${EVENT_TYPE_CONFIG[activeType].label} » pour le moment.`
              : 'Aucun évènement créé pour le moment.'}
          </AureakText>
          <Pressable style={[s.newBtn, { marginTop: space.md }]} onPress={() => setShowModal(true)}>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
              + Nouvel évènement
            </AureakText>
          </Pressable>
        </View>
      ) : !isStubType ? (
        <View style={s.grid}>
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => handleCardPress(event)}
            />
          ))}
        </View>
      ) : null}

      {/* Modal sélection type */}
      <NewEventModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSelectType={handleSelectEventType}
      />
    </ScrollView>
  )
}

// ============================================================
// Styles
// ============================================================

const s = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.xl, gap: space.md },
  header    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  newBtn: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : 7,
  },

  pillsScrollView: { marginHorizontal: -space.xl },
  pillsRow       : { flexDirection: 'row', gap: space.xs, paddingHorizontal: space.xl, paddingVertical: space.xs },

  filterPill: {
    paddingHorizontal: 12,
    paddingVertical  : 5,
    borderRadius     : 20,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  filterPillActive: {
    backgroundColor: colors.light.muted,
    borderColor    : colors.border.light,
  },
  filterPillText      : { fontSize: 12, color: colors.text.muted, fontWeight: '400' },
  filterPillTextActive: { color: colors.text.dark, fontWeight: '700' },

  pill    : { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 10, fontWeight: '700' },

  stubBanner: {
    borderWidth  : 1,
    borderRadius : radius.card,
    padding      : space.md,
    marginBottom : space.sm,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },

  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
    width          : '100%' as never,
    maxWidth       : 360,
    minWidth       : 280,
    boxShadow      : shadows.sm,
  } as never,
  cardAccent: { height: 3 },

  chip: {
    backgroundColor  : colors.light.muted,
    borderRadius     : 12,
    paddingHorizontal: 8,
    paddingVertical  : 3,
    alignSelf        : 'flex-start',
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },

  emptyState: {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  emptyIcon: { fontSize: 40, marginBottom: space.sm },

  // Modal
  modalOverlay: {
    flex           : 1,
    backgroundColor: colors.overlay.dark,
    justifyContent : 'center',
    alignItems     : 'center',
    padding        : space.xl,
  },
  modalBox: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    padding        : space.xl,
    width          : '100%' as never,
    maxWidth       : 440,
  },

  typeOption: {
    flexDirection   : 'row',
    alignItems      : 'center',
    gap             : space.sm,
    padding         : space.sm,
    borderRadius    : 8,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    marginBottom    : space.xs,
  },
  typeColorDot: { width: 10, height: 10, borderRadius: 5 },

  btnSecondary: {
    flex             : 1,
    paddingVertical  : space.sm,
    borderRadius     : 7,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    alignItems       : 'center',
  },
  btnPrimary: {
    flex             : 1,
    paddingVertical  : space.sm,
    borderRadius     : 7,
    backgroundColor  : colors.accent.gold,
    alignItems       : 'center',
  },
})
