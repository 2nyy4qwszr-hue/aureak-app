'use client'
// Fiche groupe — entité centrale : infos, joueurs, staff, séances
// Hiérarchie : Implantation → Groupe → Séances → Présences / Évaluations
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, Modal } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getGroup, updateGroup,
  listGroupMembersWithProfiles, listGroupMembersWithDetails, addGroupMember, removeGroupMember,
  listGroupStaff, addGroupStaff, removeGroupStaff,
  listAvailableCoaches, listAvailableChildren,
  listSessionsByGroup,
  generateYearSessions, listSchoolCalendarExceptions,
  listAttendanceStatsByGroup,
  updateGroupFormation,
  transferGroupMember,
  listGroupsWithMembers,
} from '@aureak/api-client'
import type { AttendanceStat } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import {
  generateGroupName, GROUP_METHODS, DAYS_OF_WEEK, GROUP_DURATIONS, METHOD_COLOR,
  buildGroupBaseName,
} from '@aureak/business-logic'
import { AureakText, Badge, TacticalBoard, CapacityIndicator } from '@aureak/ui'
import type { FormationData } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import { SESSION_TYPE_LABELS } from '@aureak/types'
import type {
  Group, GroupMethod, GroupStaffRole, GroupStaffWithName, GroupMemberWithName, GroupMemberWithDetails, SchoolCalendarException, SessionType,
} from '@aureak/types'
// Story 56-2 : import FormationData depuis @aureak/ui (re-export du composant TacticalBoard)
// FormationData est aussi dans @aureak/types mais importée localement depuis ui pour éviter circularité
import type { GenerateYearSessionsResult } from '@aureak/api-client'

// ── Constants ──────────────────────────────────────────────────────────────────

const START_HOURS   = [7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21]
const START_MINUTES = [0, 15, 30, 45]

const STAFF_ROLES: { key: GroupStaffRole; label: string; color: string }[] = [
  { key: 'principal',  label: 'Coach principal',  color: colors.accent.gold       },
  { key: 'assistant',  label: 'Coach assistant',  color: colors.status.info      },
  { key: 'remplacant', label: 'Coach remplaçant', color: colors.text.muted    },
]

const SESSION_STATUS_LABEL: Record<string, string> = {
  planifiée: 'Planifiée',
  en_cours : 'En cours',
  terminée : 'Terminée',
  annulée  : 'Annulée',
}
const SESSION_STATUS_COLOR: Record<string, string> = {
  planifiée: colors.accent.gold,
  en_cours : colors.status.info,
  terminée : colors.status.present,
  annulée  : colors.status.attention,
}

// ── Tab types ──────────────────────────────────────────────────────────────────

type Tab = 'infos' | 'joueurs' | 'staff' | 'seances' | 'formation'

// ── Sub-components ────────────────────────────────────────────────────────────

function ChipRow<T extends string | number>({
  options, value, onSelect, label, color,
}: {
  options : T[]
  value   : T
  onSelect: (v: T) => void
  label?  : (v: T) => string
  color?  : (v: T) => string
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map(opt => {
        const active = opt === value
        const c = color ? color(opt) : colors.accent.gold
        return (
          <Pressable
            key={String(opt)}
            style={{
              borderWidth      : 1,
              borderColor      : active ? c : colors.border.light,
              borderRadius     : 20,
              paddingHorizontal: 11,
              paddingVertical  : 4,
              backgroundColor  : active ? c + '20' : 'transparent',
            }}
            onPress={() => onSelect(opt)}
          >
            <AureakText variant="caption" style={{ color: active ? c : colors.text.muted, fontWeight: active ? '700' : '400' }}>
              {label ? label(opt) : String(opt)}
            </AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700', letterSpacing: 0.8, fontSize: 10, marginBottom: 6, marginTop: space.sm, textTransform: 'uppercase' as never }}>
      {children}
    </AureakText>
  )
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[sc.card, style]}>
      {children}
    </View>
  )
}
const sc = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    gap            : 2,
  },
})

// ── Infos tab ─────────────────────────────────────────────────────────────────

function InfosTab({
  group,
  implantationName,
  onSaved,
}: {
  group           : Group & { implantationName: string }
  implantationName: string
  onSaved         : () => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)

  const [method,     setMethod]     = useState<GroupMethod>(group.method ?? 'Goal and Player')
  const [day,        setDay]        = useState(group.dayOfWeek ?? 'Mardi')
  const [startH,     setStartH]     = useState(group.startHour ?? 17)
  const [startM,     setStartM]     = useState(group.startMinute ?? 0)
  const [duration,   setDuration]   = useState(group.durationMinutes ?? 60)
  const [maxPlayers, setMaxPlayers] = useState<string>(String(group.maxPlayers ?? 20))

  // Reset on cancel
  const handleCancel = () => {
    setMethod(group.method ?? 'Goal and Player')
    setDay(group.dayOfWeek ?? 'Mardi')
    setStartH(group.startHour ?? 17)
    setStartM(group.startMinute ?? 0)
    setDuration(group.durationMinutes ?? 60)
    setMaxPlayers(String(group.maxPlayers ?? 20))
    setEditing(false)
  }

  const previewName = buildGroupBaseName(implantationName, day, startH, startM, method)

  const handleSave = async () => {
    setSaving(true)
    try {
      const maxNum = parseInt(maxPlayers, 10)
      await updateGroup(group.id, {
        method         : method,
        dayOfWeek      : day,
        startHour      : startH,
        startMinute    : startM,
        durationMinutes: duration,
        name           : previewName,
        maxPlayers     : isNaN(maxNum) ? null : maxNum,
      })
      setEditing(false)
      onSaved()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[groups/detail] handleSave error:', err)
    } finally {
      setSaving(false)
    }
  }

  const methodColor = METHOD_COLOR[group.method ?? 'Goal and Player']

  if (!editing) {
    return (
      <SectionCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
          <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 0.8, fontSize: 10, textTransform: 'uppercase' as never }}>
            PARAMÈTRES DU GROUPE
          </AureakText>
          <Pressable
            style={info.editBtn}
            onPress={() => setEditing(true)}
          >
            <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '600', fontSize: 12 }}>
              Modifier
            </AureakText>
          </Pressable>
        </View>

        <View style={info.row}>
          <AureakText variant="caption" style={info.label}>Implantation</AureakText>
          <AureakText variant="body" style={info.value}>{implantationName}</AureakText>
        </View>
        <View style={info.row}>
          <AureakText variant="caption" style={info.label}>Méthode</AureakText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              backgroundColor: methodColor + '18',
              borderColor    : methodColor,
              borderWidth    : 1,
              borderRadius   : 20,
              paddingHorizontal: 9,
              paddingVertical  : 2,
            }}>
              <AureakText variant="caption" style={{ color: methodColor, fontWeight: '700', fontSize: 11 }}>
                {group.method ?? '—'}
              </AureakText>
            </View>
          </View>
        </View>
        <View style={info.row}>
          <AureakText variant="caption" style={info.label}>Jour</AureakText>
          <AureakText variant="body" style={info.value}>{group.dayOfWeek ?? '—'}</AureakText>
        </View>
        <View style={info.row}>
          <AureakText variant="caption" style={info.label}>Heure</AureakText>
          <AureakText variant="body" style={info.value}>
            {group.startHour !== null
              ? `${String(group.startHour).padStart(2,'0')}h${String(group.startMinute ?? 0).padStart(2,'0')}`
              : '—'}
          </AureakText>
        </View>
        <View style={info.row}>
          <AureakText variant="caption" style={info.label}>Durée</AureakText>
          <AureakText variant="body" style={info.value}>
            {group.durationMinutes ? `${group.durationMinutes} min` : '—'}
          </AureakText>
        </View>
        {/* Story 56-6 — Indicateur capacité */}
        <View style={[info.row, { alignItems: 'center' }]}>
          <AureakText variant="caption" style={info.label}>Capacité</AureakText>
          <View style={{ flex: 1 }}>
            {group.maxPlayers != null ? (
              <CapacityIndicator
                memberCount={0}
                maxPlayers={group.maxPlayers}
              />
            ) : (
              <AureakText variant="body" style={info.value}>—</AureakText>
            )}
          </View>
        </View>
      </SectionCard>
    )
  }

  // Edit mode
  return (
    <SectionCard style={{ borderColor: colors.accent.gold + '60' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
        <AureakText variant="label" style={{ color: colors.accent.gold, letterSpacing: 0.8, fontSize: 10, textTransform: 'uppercase' as never }}>
          MODIFIER LE GROUPE
        </AureakText>
      </View>

      <FieldLabel>Méthode</FieldLabel>
      <ChipRow
        options={GROUP_METHODS}
        value={method}
        onSelect={(v) => setMethod(v as GroupMethod)}
        color={m => METHOD_COLOR[m]}
      />

      <FieldLabel>Jour</FieldLabel>
      <ChipRow
        options={[...DAYS_OF_WEEK]}
        value={day}
        onSelect={(v) => setDay(String(v))}
      />

      <FieldLabel>Heure de début</FieldLabel>
      <ChipRow
        options={START_HOURS}
        value={startH}
        onSelect={(v) => setStartH(Number(v))}
        label={h => `${String(h).padStart(2,'0')}h`}
      />
      <View style={{ marginTop: 6 }}>
        <ChipRow
          options={START_MINUTES}
          value={startM}
          onSelect={(v) => setStartM(Number(v))}
          label={m => `h${String(m).padStart(2,'0')}`}
        />
      </View>

      <FieldLabel>Durée</FieldLabel>
      <ChipRow
        options={[...GROUP_DURATIONS]}
        value={duration}
        onSelect={(v) => setDuration(Number(v))}
        label={d => `${d} min`}
      />

      {/* Story 56-6 — Capacité maximale */}
      <FieldLabel>Capacité maximale (joueurs)</FieldLabel>
      <TextInput
        style={info.maxInput}
        value={maxPlayers}
        onChangeText={setMaxPlayers}
        placeholder="Ex : 20"
        placeholderTextColor={colors.text.muted}
        keyboardType="numeric"
        maxLength={3}
      />

      {/* Name preview */}
      <View style={info.preview}>
        <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: 2 }}>Nouveau nom généré</AureakText>
        <AureakText variant="body" style={{ color: colors.accent.gold, fontWeight: '700' }}>{previewName}</AureakText>
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
        <Pressable style={info.cancelBtn} onPress={handleCancel}>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
        </Pressable>
        <Pressable style={info.saveBtn} onPress={handleSave} disabled={saving}>
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </AureakText>
        </Pressable>
      </View>
    </SectionCard>
  )
}

const info = StyleSheet.create({
  row     : { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border.divider + '40' },
  label   : { width: 140, color: colors.text.muted, fontSize: 12 },
  value   : { flex: 1, fontSize: 13 },
  editBtn : {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.accent.gold + '60',
  },
  preview : {
    backgroundColor: colors.light.muted,
    borderRadius   : 6,
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '40',
    padding        : space.sm,
    marginTop      : space.sm,
  },
  cancelBtn: {
    flex: 1, paddingVertical: space.xs + 2,
    borderRadius: 6, borderWidth: 1, borderColor: colors.border.light,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 2, paddingVertical: space.xs + 2,
    borderRadius: 6, backgroundColor: colors.accent.gold,
    alignItems: 'center',
  },
  maxInput: {
    backgroundColor  : colors.light.muted,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs + 2,
    color            : colors.text.dark,
    fontSize         : 13,
    width            : 80,
  },
})

// ── Staff tab ─────────────────────────────────────────────────────────────────

function StaffTab({
  groupId,
  staff,
  coaches,
  tenantId,
  onRefresh,
}: {
  groupId  : string
  staff    : GroupStaffWithName[]
  coaches  : Array<{ id: string; name: string }>
  tenantId : string
  onRefresh: () => void
}) {
  const [addingRole, setAddingRole] = useState<GroupStaffRole | null>(null)
  const [selectedId, setSelectedId] = useState<string>('')
  const [search,     setSearch]     = useState('')
  const [saving,     setSaving]     = useState(false)
  const [removing,   setRemoving]   = useState<string | null>(null)

  const assignedCoachIds = new Set(staff.map(s => s.coachId))
  const filteredCoaches  = coaches.filter(c =>
    !assignedCoachIds.has(c.id) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAdd = async () => {
    if (!addingRole || !selectedId) return
    setSaving(true)
    try {
      await addGroupStaff({ groupId, coachId: selectedId, role: addingRole, tenantId })
      setAddingRole(null)
      setSelectedId('')
      setSearch('')
      onRefresh()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[groups/detail] GroupStaffSection.handleAdd error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    setRemoving(id)
    try {
      await removeGroupStaff(id)
      onRefresh()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[groups/detail] GroupStaffSection.handleRemove error:', err)
    } finally {
      setRemoving(null)
    }
  }

  return (
    <SectionCard>
      <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 0.8, fontSize: 10, textTransform: 'uppercase' as never, marginBottom: space.sm }}>
        STAFF DU GROUPE
      </AureakText>

      {STAFF_ROLES.map(roleConfig => {
        const assigned = staff.filter(s => s.role === roleConfig.key)
        const isAdding = addingRole === roleConfig.key

        return (
          <View key={roleConfig.key} style={stf.roleBlock}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[stf.roleDot, { backgroundColor: roleConfig.color }]} />
                <AureakText variant="caption" style={{ color: roleConfig.color, fontWeight: '700', fontSize: 12 }}>
                  {roleConfig.label}
                </AureakText>
              </View>
              {!isAdding && (
                <Pressable
                  style={stf.addBtn}
                  onPress={() => { setAddingRole(roleConfig.key); setSelectedId(''); setSearch('') }}
                >
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 11 }}>+ Assigner</AureakText>
                </Pressable>
              )}
            </View>

            {assigned.length === 0 && !isAdding ? (
              <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never, fontSize: 12, paddingLeft: 16 }}>
                Non assigné
              </AureakText>
            ) : (
              assigned.map(s => (
                <View key={s.id} style={stf.coachRow}>
                  <View style={stf.avatar}>
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '800', fontSize: 12 }}>
                      {s.coachName.charAt(0).toUpperCase()}
                    </AureakText>
                  </View>
                  <AureakText variant="body" style={{ flex: 1, fontSize: 13 }}>{s.coachName}</AureakText>
                  <Pressable
                    style={stf.removeBtn}
                    onPress={() => handleRemove(s.id)}
                    disabled={removing === s.id}
                  >
                    <AureakText variant="caption" style={{ color: colors.status.attention, fontSize: 11 }}>
                      {removing === s.id ? '…' : '✕'}
                    </AureakText>
                  </Pressable>
                </View>
              ))
            )}

            {isAdding && (
              <View style={stf.addForm}>
                <TextInput
                  style={stf.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Rechercher un coach…"
                  placeholderTextColor={colors.text.muted}
                />
                <View style={stf.coachList}>
                  {filteredCoaches.length === 0 ? (
                    <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12, padding: space.xs }}>
                      Aucun coach disponible.
                    </AureakText>
                  ) : (
                    filteredCoaches.slice(0, 8).map(c => (
                      <Pressable
                        key={c.id}
                        style={[stf.coachOption, selectedId === c.id && stf.coachOptionActive]}
                        onPress={() => setSelectedId(c.id)}
                      >
                        <AureakText variant="caption" style={{ color: selectedId === c.id ? colors.accent.gold : colors.text.dark, fontSize: 12 }}>
                          {c.name}
                        </AureakText>
                      </Pressable>
                    ))
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Pressable style={stf.cancelBtn} onPress={() => { setAddingRole(null); setSelectedId(''); setSearch('') }}>
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
                  </Pressable>
                  <Pressable
                    style={[stf.confirmBtn, (!selectedId || saving) && { opacity: 0.4 }]}
                    onPress={handleAdd}
                    disabled={!selectedId || saving}
                  >
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                      {saving ? '…' : 'Assigner'}
                    </AureakText>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )
      })}
    </SectionCard>
  )
}

const stf = StyleSheet.create({
  roleBlock : {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider + '40',
    paddingVertical  : space.sm,
  },
  roleDot   : { width: 8, height: 8, borderRadius: 4 },
  addBtn    : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1, borderColor: colors.accent.gold + '60' },
  coachRow  : { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingVertical: 4 },
  avatar    : {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtn : { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.status.attention + '40', alignItems: 'center', justifyContent: 'center' },
  addForm   : { gap: space.sm, paddingLeft: 14, paddingTop: 8, paddingBottom: 4 },
  searchInput: {
    backgroundColor: colors.light.muted,
    borderWidth    : 1, borderColor: colors.border.light,
    borderRadius   : 6, paddingHorizontal: space.sm, paddingVertical: space.xs + 2,
    color          : colors.text.dark, fontSize: 12,
  },
  coachList : {
    backgroundColor: colors.light.muted,
    borderRadius   : 6, borderWidth: 1, borderColor: colors.border.light,
    maxHeight      : 160, overflow: 'hidden' as never,
  },
  coachOption: { paddingHorizontal: space.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border.divider + '30' },
  coachOptionActive: { backgroundColor: colors.light.primary },
  cancelBtn  : { flex: 1, paddingVertical: space.xs + 2, borderRadius: 6, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center' },
  confirmBtn : { flex: 2, paddingVertical: space.xs + 2, borderRadius: 6, backgroundColor: colors.accent.gold, alignItems: 'center' },
})

// ── Helpers mini-stats ────────────────────────────────────────────────────────

function formatBirthDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function attendanceRateColor(present: number, total: number): string {
  if (total === 0) return colors.text.muted
  const pct = (present / total) * 100
  if (pct >= 80) return colors.status.present
  if (pct >= 60) return colors.status.attention
  return colors.status.absent
}

// ── Joueurs tab ───────────────────────────────────────────────────────────────

function JoueursTab({
  groupId,
  groupName,
  members,
  membersWithDetails,
  attendanceStats,
  children,
  tenantId,
  onRefresh,
  maxPlayers,
}: {
  groupId           : string
  groupName         : string
  members           : GroupMemberWithName[]
  membersWithDetails: GroupMemberWithDetails[]
  attendanceStats   : AttendanceStat[]
  children          : Array<{ id: string; name: string }>
  tenantId          : string
  onRefresh         : () => void
  maxPlayers?       : number | null
}) {
  const router = useRouter()
  const [adding,     setAdding]     = useState(false)
  const [search,     setSearch]     = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [removing,   setRemoving]   = useState<string | null>(null)
  // Story 56-4 — Bouton Transférer (alternative mobile)
  const [transferMember, setTransferMember] = useState<GroupMemberWithName | null>(null)
  const [allGroups,      setAllGroups]      = useState<Array<{ id: string; name: string }>>([])
  const [transferTargetId, setTransferTargetId] = useState<string>('')
  const [loadingGroups,    setLoadingGroups]    = useState(false)
  const [transferring,     setTransferring]     = useState(false)

  const detailsMap = new Map(membersWithDetails.map(m => [m.childId, m]))
  const statsMap   = new Map(attendanceStats.map(s => [s.childId, s]))

  const enrolledIds      = new Set(members.map(m => m.childId))
  const availableChildren = children.filter(c =>
    !enrolledIds.has(c.id) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  )

  // Story 56-6 — Blocage ajout si groupe complet
  const isGroupFull = maxPlayers != null && members.length >= maxPlayers

  const handleAdd = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await addGroupMember(groupId, selectedId, tenantId)
      setAdding(false)
      setSelectedId('')
      setSearch('')
      onRefresh()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[groups/detail] GroupMembersSection.handleAdd error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (childId: string) => {
    setRemoving(childId)
    try {
      await removeGroupMember(groupId, childId)
      onRefresh()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[groups/detail] GroupMembersSection.handleRemove error:', err)
    } finally {
      setRemoving(null)
    }
  }

  // Story 56-4 — Transfert mobile : ouvrir sélecteur de groupe cible
  const handleOpenTransfer = async (member: GroupMemberWithName) => {
    setTransferMember(member)
    setTransferTargetId('')
    setLoadingGroups(true)
    try {
      const allG = await listGroupsWithMembers()
      setAllGroups(
        allG
          .filter(g => g.id !== groupId)
          .map(g => ({ id: g.id, name: g.name }))
      )
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[groups/detail] handleOpenTransfer error:', err)
    } finally {
      setLoadingGroups(false)
    }
  }

  const handleConfirmTransfer = async () => {
    if (!transferMember || !transferTargetId) return
    setTransferring(true)
    try {
      const { error } = await transferGroupMember(
        transferMember.childId, groupId, transferTargetId, tenantId
      )
      if (error && process.env.NODE_ENV !== 'production') {
        console.error('[groups/detail] handleConfirmTransfer error:', error)
      }
      setTransferMember(null)
      onRefresh()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[groups/detail] handleConfirmTransfer error:', err)
    } finally {
      setTransferring(false)
    }
  }

  // Story 56-4 — Drag start : mettre les données dans dataTransfer
  function handleDragStart(e: React.DragEvent, member: GroupMemberWithName) {
    e.dataTransfer.setData('childId',      member.childId)
    e.dataTransfer.setData('displayName',  member.displayName)
    e.dataTransfer.setData('fromGroupId',  groupId)
    e.dataTransfer.setData('fromGroupName', groupName)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <>
    <SectionCard>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
        <View>
          <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 0.8, fontSize: 10, textTransform: 'uppercase' as never }}>
            JOUEURS DU GROUPE
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginTop: 2 }}>
            {members.length} joueur{members.length !== 1 ? 's' : ''}
          </AureakText>
        </View>
        {!adding && (
          <Pressable
            style={[jou.addBtn, isGroupFull && { opacity: 0.5 }]}
            onPress={() => {
              if (isGroupFull) return
              setAdding(true)
              setSelectedId('')
              setSearch('')
            }}
            // @ts-ignore — title HTML natif pour tooltip web
            title={isGroupFull ? 'Groupe complet — réduisez la capacité ou transférez un joueur' : undefined}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 11 }}>
              {isGroupFull ? 'Groupe complet' : '+ Ajouter'}
            </AureakText>
          </Pressable>
        )}
      </View>

      {members.length === 0 && !adding ? (
        <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
          Aucun joueur dans ce groupe. Ajoutez le premier joueur.
        </AureakText>
      ) : (
        members.map((m, idx) => {
          const detail = detailsMap.get(m.childId)
          const stat   = statsMap.get(m.childId)
          const rateColor = stat ? attendanceRateColor(stat.present, stat.total) : colors.text.muted
          const rateLabel = stat
            ? stat.total === 0
              ? 'Aucune séance'
              : `${Math.round((stat.present / stat.total) * 100)}% (${stat.present} présent${stat.present !== 1 ? 's' : ''} / ${stat.total} séance${stat.total !== 1 ? 's' : ''})`
            : 'Aucune séance'

          // Story 56-8 — Handler navigation avec slide transition
          const handleNavigateToChild = (childId: string) => {
            if (typeof document !== 'undefined') {
              // Appliquer la class CSS slide-out sur le body pour la page courante
              const pageEl = document.getElementById('aureak-group-detail-page')
              if (pageEl) {
                pageEl.classList.add('aureak-slide-out-left')
                setTimeout(() => {
                  router.push(`/(admin)/children/${childId}` as never)
                }, 150)
                return
              }
            }
            router.push(`/(admin)/children/${childId}` as never)
          }

          return (
            <Pressable
              key={m.childId}
              onPress={() => handleNavigateToChild(m.childId)}
              style={({ pressed }) => [
                jou.memberRow,
                idx % 2 === 1 && { backgroundColor: colors.light.muted },
                pressed && { backgroundColor: colors.light.hover },
              ]}
              // @ts-ignore — draggable HTML5 (web only, Story 56-4)
              draggable={true}
              onDragStart={(e: React.DragEvent) => handleDragStart(e, m)}
            >
              {/* Drag handle */}
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12, marginRight: 2, cursor: 'grab' as never }}>
                ⋮⋮
              </AureakText>
              <View style={jou.memberAvatar}>
                <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '800', fontSize: 12 }}>
                  {m.displayName.charAt(0).toUpperCase()}
                </AureakText>
              </View>
              <View style={{ flex: 1 }}>
                <AureakText variant="body" style={{ fontSize: 13 }}>{m.displayName}</AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginTop: 1 }}>
                  {formatBirthDate(detail?.birthDate ?? null)}
                  {' · '}
                  {detail?.currentClub ?? '—'}
                  {' · '}
                  <AureakText variant="caption" style={{ fontSize: 11, color: rateColor, fontWeight: '600' }}>
                    {rateLabel}
                  </AureakText>
                </AureakText>
              </View>
              {/* Bouton Transférer (alternative mobile, AC6 Story 56-4) */}
              <Pressable
                style={jou.transferBtn}
                onPress={(e) => { e.stopPropagation?.(); handleOpenTransfer(m) }}
              >
                <AureakText variant="caption" style={{ color: colors.entity.club, fontSize: 10, fontWeight: '700' }}>
                  ⇄
                </AureakText>
              </Pressable>
              <AureakText variant="caption" style={{ fontSize: 16, color: colors.text.secondary, marginRight: 4 }}>›</AureakText>
              <Pressable
                style={jou.removeBtn}
                onPress={(e) => { e.stopPropagation?.(); handleRemove(m.childId) }}
                disabled={removing === m.childId}
              >
                <AureakText variant="caption" style={{ color: colors.status.attention, fontSize: 11 }}>
                  {removing === m.childId ? '…' : '✕'}
                </AureakText>
              </Pressable>
            </Pressable>
          )
        })
      )}

      {adding && (
        <View style={jou.addForm}>
          <TextInput
            style={jou.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un joueur…"
            placeholderTextColor={colors.text.muted}
          />
          <View style={jou.childList}>
            {availableChildren.length === 0 ? (
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12, padding: space.sm }}>
                Aucun joueur disponible (tous déjà inscrits, ou aucun compte enfant).
              </AureakText>
            ) : (
              availableChildren.slice(0, 10).map(c => (
                <Pressable
                  key={c.id}
                  style={[jou.childOption, selectedId === c.id && jou.childOptionActive]}
                  onPress={() => setSelectedId(c.id)}
                >
                  <AureakText variant="caption" style={{ color: selectedId === c.id ? colors.accent.gold : colors.text.dark, fontSize: 12 }}>
                    {c.name}
                  </AureakText>
                </Pressable>
              ))
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Pressable style={jou.cancelBtn} onPress={() => { setAdding(false); setSelectedId(''); setSearch('') }}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
            </Pressable>
            <Pressable
              style={[jou.confirmBtn, (!selectedId || saving) && { opacity: 0.4 }]}
              onPress={handleAdd}
              disabled={!selectedId || saving}
            >
              <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                {saving ? '…' : 'Ajouter au groupe'}
              </AureakText>
            </Pressable>
          </View>
        </View>
      )}
    </SectionCard>

    {/* ── Modal Transférer joueur (AC6 Story 56-4 — alternative mobile) ── */}
    <Modal visible={!!transferMember} transparent animationType="fade">
      <Pressable
        style={jou.overlay}
        onPress={() => { if (!transferring) setTransferMember(null) }}
      >
        <Pressable style={jou.modal} onPress={e => e.stopPropagation?.()}>
          <AureakText variant="h3" style={{ color: colors.text.dark, marginBottom: space.sm, fontSize: 15 }}>
            Transférer vers un autre groupe
          </AureakText>
          {transferMember && (
            <>
              <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: space.sm }}>
                Joueur : <AureakText variant="caption" style={{ fontWeight: '700', color: colors.text.dark }}>{transferMember.displayName}</AureakText>
              </AureakText>

              {loadingGroups ? (
                <AureakText variant="caption" style={{ color: colors.text.muted }}>Chargement des groupes…</AureakText>
              ) : allGroups.length === 0 ? (
                <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
                  Aucun autre groupe disponible.
                </AureakText>
              ) : (
                <View style={jou.groupList}>
                  {allGroups.map(g => (
                    <Pressable
                      key={g.id}
                      style={[jou.groupOption, transferTargetId === g.id && jou.groupOptionActive]}
                      onPress={() => setTransferTargetId(g.id)}
                    >
                      <AureakText variant="caption" style={{ color: transferTargetId === g.id ? colors.accent.gold : colors.text.dark, fontSize: 12 }}>
                        {g.name}
                      </AureakText>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: space.sm }}>
                <Pressable style={jou.cancelBtn} onPress={() => setTransferMember(null)}>
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
                </Pressable>
                <Pressable
                  style={[jou.confirmBtn, (!transferTargetId || transferring) && { opacity: 0.4 }]}
                  onPress={handleConfirmTransfer}
                  disabled={!transferTargetId || transferring}
                >
                  <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                    {transferring ? 'Transfert…' : 'Transférer'}
                  </AureakText>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
    </>
  )
}

const jou = StyleSheet.create({
  addBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.sm + 2, paddingVertical: 4, borderRadius: 6 },
  memberRow    : { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 6, borderRadius: 6 },
  memberAvatar : { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center', justifyContent: 'center' },
  removeBtn    : { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.status.attention + '40', alignItems: 'center', justifyContent: 'center' },
  addForm      : { gap: space.sm, marginTop: space.sm, padding: space.sm, backgroundColor: colors.light.muted, borderRadius: 8, borderWidth: 1, borderColor: colors.border.light },
  searchInput  : { backgroundColor: colors.light.primary, borderWidth: 1, borderColor: colors.border.light, borderRadius: 6, paddingHorizontal: space.sm, paddingVertical: space.xs + 2, color: colors.text.dark, fontSize: 12 },
  childList    : { backgroundColor: colors.light.primary, borderRadius: 6, borderWidth: 1, borderColor: colors.border.light, maxHeight: 180, overflow: 'hidden' as never },
  childOption  : { paddingHorizontal: space.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border.divider + '30' },
  childOptionActive: { backgroundColor: colors.light.muted },
  cancelBtn    : { flex: 1, paddingVertical: space.xs + 2, borderRadius: 6, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center' },
  confirmBtn   : { flex: 2, paddingVertical: space.xs + 2, borderRadius: 6, backgroundColor: colors.accent.gold, alignItems: 'center' },
  // Story 56-4 — Bouton Transférer
  transferBtn  : { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.entity.club + '60', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.entity.club + '10' },
  // Modal transfert mobile
  overlay      : { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: space.xl },
  modal        : { backgroundColor: colors.light.surface, borderRadius: 12, padding: space.md, width: '100%', maxWidth: 400 },
  groupList    : { backgroundColor: colors.light.primary, borderRadius: 6, borderWidth: 1, borderColor: colors.border.light, maxHeight: 200, overflow: 'hidden' as never, marginTop: space.xs },
  groupOption  : { paddingHorizontal: space.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border.divider + '30' },
  groupOptionActive: { backgroundColor: colors.light.muted },
})

// ── Séances tab ───────────────────────────────────────────────────────────────

function SeancesTab({
  groupId,
  group,
  sessions,
  onNewSession,
  onRefresh,
}: {
  groupId     : string
  group       : Group
  sessions    : Array<{ id: string; scheduledAt: string; status: string; durationMinutes: number }>
  onNewSession: () => void
  onRefresh   : () => void
}) {
  const currentYear = new Date().getFullYear()
  const [showGenModal,  setShowGenModal ] = useState(false)
  const [seasonStart,   setSeasonStart  ] = useState(`${currentYear}-09-01`)
  const [seasonEnd,     setSeasonEnd    ] = useState(`${currentYear + 1}-06-30`)
  const [sessionType,   setSessionType  ] = useState<SessionType>('goal_and_player')
  const [exceptions,    setExceptions   ] = useState<SchoolCalendarException[]>([])
  const [genLoading,    setGenLoading   ] = useState(false)
  const [genError,      setGenError     ] = useState<string | null>(null)
  const [genSuccess,    setGenSuccess   ] = useState<string | null>(null)

  const loadExceptions = useCallback(async () => {
    const { data } = await listSchoolCalendarExceptions()
    setExceptions(data)
  }, [])

  useEffect(() => {
    if (showGenModal) loadExceptions()
  }, [showGenModal, loadExceptions])

  const previewCount = (() => {
    if (!seasonStart || !seasonEnd) return null
    const start = new Date(seasonStart); const end = new Date(seasonEnd)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return null
    const excSet = new Set(exceptions.filter(e => e.isNoSession).map(e => e.date))
    let count = 0; const cur = new Date(start)
    while (cur <= end) {
      if (!excSet.has(cur.toISOString().split('T')[0])) count++
      cur.setDate(cur.getDate() + 7)
    }
    return count
  })()

  const handleGenerate = async () => {
    setGenLoading(true); setGenError(null)
    const result: GenerateYearSessionsResult = await generateYearSessions(
      groupId, group.implantationId, group.tenantId,
      sessionType, seasonStart, seasonEnd
    )
    setGenLoading(false)
    if (result.error) {
      const err = result.error as { code?: string; existingCount?: number }
      setGenError(err?.code === 'SESSIONS_ALREADY_EXIST'
        ? `${err.existingCount} séances existent déjà pour cette période.`
        : 'Erreur lors de la génération.')
    } else {
      setShowGenModal(false)
      setGenSuccess(`✅ ${result.created} séances créées !`)
      setTimeout(() => setGenSuccess(null), 4000)
      onRefresh()
    }
  }

  return (
    <SectionCard>
      {/* ── Header ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
        <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 0.8, fontSize: 10, textTransform: 'uppercase' as never }}>
          SÉANCES DU GROUPE
        </AureakText>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable
            style={[sea.newBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent.gold }]}
            onPress={() => setShowGenModal(true)}
          >
            <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 11 }}>
              ⚡ Générer les séances
            </AureakText>
          </Pressable>
          <Pressable style={sea.newBtn} onPress={onNewSession}>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 11 }}>
              + Nouvelle séance
            </AureakText>
          </Pressable>
        </View>
      </View>

      {genSuccess && (
        <View style={{ backgroundColor: colors.status.successBg, borderRadius: 6, padding: space.sm, marginBottom: space.sm }}>
          <AureakText variant="caption" style={{ color: colors.status.successText, fontWeight: '700' }}>{genSuccess}</AureakText>
        </View>
      )}

      {sessions.length === 0 ? (
        <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
          Aucune séance. Créez la première séance de ce groupe ou générez une année complète.
        </AureakText>
      ) : (
        sessions.map(session => {
          const d     = new Date(session.scheduledAt)
          const color = SESSION_STATUS_COLOR[session.status] ?? colors.text.muted
          return (
            <View key={session.id} style={sea.sessionRow}>
              <View style={sea.dateBlock}>
                <AureakText variant="body" style={{ fontWeight: '700', fontSize: 16, color: colors.accent.gold }}>
                  {String(d.getDate()).padStart(2,'0')}
                </AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
                  {d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                </AureakText>
              </View>
              <View style={{ flex: 1 }}>
                <AureakText variant="body" style={{ fontWeight: '600', fontSize: 13 }}>
                  {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {session.durationMinutes ? ` · ${session.durationMinutes} min` : ''}
                </AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
                  {d.toLocaleDateString('fr-FR', { weekday: 'long' })}
                </AureakText>
              </View>
              <View style={[sea.statusBadge, { borderColor: color + '60', backgroundColor: color + '15' }]}>
                <AureakText variant="caption" style={{ color, fontWeight: '700', fontSize: 10 }}>
                  {SESSION_STATUS_LABEL[session.status] ?? session.status}
                </AureakText>
              </View>
            </View>
          )
        })
      )}

      {/* ── Modal génération ── */}
      <Modal visible={showGenModal} transparent animationType="fade">
        <View style={sea.overlay}>
          <View style={sea.modal}>
            <AureakText variant="h3" style={{ marginBottom: 4 }}>Générer les séances</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: space.md }}>
              Groupe : {group.name}
            </AureakText>

            {/* Type pédagogique */}
            <AureakText variant="caption" style={sea.fieldLabel}>Type pédagogique</AureakText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: space.md }}>
              {(['goal_and_player','technique','situationnel','decisionnel','perfectionnement','integration','equipe'] as SessionType[]).map(t => (
                <Pressable
                  key={t}
                  style={[sea.typeChip, sessionType === t && { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '20' }]}
                  onPress={() => setSessionType(t)}
                >
                  <AureakText variant="caption" style={{ fontSize: 10, color: sessionType === t ? colors.accent.gold : colors.text.muted }}>
                    {SESSION_TYPE_LABELS[t]}
                  </AureakText>
                </Pressable>
              ))}
            </View>

            {/* Dates */}
            <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.md }}>
              <View style={{ flex: 1 }}>
                <AureakText variant="caption" style={sea.fieldLabel}>Début</AureakText>
                <TextInput
                  style={sea.input}
                  value={seasonStart}
                  onChangeText={setSeasonStart}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AureakText variant="caption" style={sea.fieldLabel}>Fin</AureakText>
                <TextInput
                  style={sea.input}
                  value={seasonEnd}
                  onChangeText={setSeasonEnd}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            {/* Preview */}
            {previewCount !== null && (
              <View style={sea.preview}>
                <AureakText variant="body" style={{ color: colors.accent.gold, fontWeight: '700' }}>
                  ≈ {previewCount} séances seront créées
                </AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  {exceptions.filter(e => e.isNoSession).length} jours exclus (vacances scolaires)
                </AureakText>
              </View>
            )}

            {genError && (
              <View style={{ backgroundColor: colors.status.errorBorderSevere, borderRadius: 6, padding: space.sm, marginBottom: space.sm }}>
                <AureakText variant="caption" style={{ color: colors.status.errorText }}>{genError}</AureakText>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' }}>
              <Pressable
                style={[sea.genBtn, genLoading && { opacity: 0.6 }]}
                onPress={handleGenerate}
                disabled={genLoading}
              >
                <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                  {genLoading ? 'Génération…' : 'Confirmer'}
                </AureakText>
              </Pressable>
              <Pressable
                style={[sea.genBtn, { backgroundColor: 'transparent', borderColor: colors.border.light }]}
                onPress={() => { setShowGenModal(false); setGenError(null) }}
              >
                <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SectionCard>
  )
}

const sea = StyleSheet.create({
  newBtn    : { backgroundColor: colors.accent.gold, paddingHorizontal: space.sm + 2, paddingVertical: 4, borderRadius: 6 },
  sessionRow: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.md,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider + '40',
  },
  dateBlock: {
    width          : 40,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : 12,
    borderWidth      : 1,
  },
  overlay: {
    flex: 1, backgroundColor: colors.overlay.dark,
    justifyContent: 'center', alignItems: 'center', padding: space.xl,
  },
  modal: {
    backgroundColor: colors.light.surface, borderRadius: 12, padding: space.xl,
    width: '100%', maxWidth: 480, boxShadow: shadows.md as never,
  },
  fieldLabel: {
    color: colors.text.muted, fontWeight: '700', fontSize: 10,
    letterSpacing: 0.8, textTransform: 'uppercase' as never, marginBottom: 4,
  },
  typeChip: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border.light,
  },
  input: {
    borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs,
    padding: space.sm, color: colors.text.dark, backgroundColor: colors.light.primary,
  },
  preview: {
    backgroundColor: colors.accent.gold + '12', borderRadius: 8, padding: space.sm,
    marginBottom: space.sm, borderWidth: 1, borderColor: colors.accent.gold + '40',
  },
  genBtn: {
    backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: space.sm,
    borderRadius: 7, borderWidth: 1, borderColor: colors.accent.gold,
  },
})

// ── Main page ──────────────────────────────────────────────────────────────────

type GroupState = (Group & { implantationName: string }) | null

export default function GroupDetailPage() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const router      = useRouter()
  const tenantId    = useAuthStore(s => s.tenantId) ?? ''

  const [tab,     setTab]     = useState<Tab>('infos')
  const [group,   setGroup]   = useState<GroupState>(null)
  const [staff,   setStaff]   = useState<GroupStaffWithName[]>([])
  const [members, setMembers] = useState<GroupMemberWithName[]>([])
  const [membersWithDetails, setMembersWithDetails] = useState<GroupMemberWithDetails[]>([])
  const [attendanceStats,    setAttendanceStats]    = useState<AttendanceStat[]>([])
  const [sessions, setSessions] = useState<Array<{ id: string; scheduledAt: string; status: string; durationMinutes: number }>>([])
  const [coaches,  setCoaches]  = useState<Array<{ id: string; name: string }>>([])
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([])
  const [loading,  setLoading]  = useState(true)
  // Story 56-2 — Formation tactique
  const [formationSaving, setFormationSaving] = useState(false)

  const loadGroup = useCallback(async () => {
    if (!groupId) return
    const { data } = await getGroup(groupId)
    setGroup(data as GroupState)
  }, [groupId])

  const loadStaff = useCallback(async () => {
    if (!groupId) return
    const data = await listGroupStaff(groupId)
    setStaff(data)
  }, [groupId])

  const loadMembers = useCallback(async () => {
    if (!groupId) return
    const [basic, detailed] = await Promise.all([
      listGroupMembersWithProfiles(groupId),
      listGroupMembersWithDetails(groupId),
    ])
    setMembers(basic)
    setMembersWithDetails(detailed)
  }, [groupId])

  const loadAttendanceStats = useCallback(async () => {
    if (!groupId) return
    setAttendanceStats([])
    try {
      const data = await listAttendanceStatsByGroup(groupId)
      setAttendanceStats(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[groups/detail] loadAttendanceStats error:', err)
    }
  }, [groupId])

  const loadSessions = useCallback(async () => {
    if (!groupId) return
    const data = await listSessionsByGroup(groupId, { limit: 10 })
    setSessions(data)
  }, [groupId])

  const loadAll = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    try {
      const [_, __, ___, ____, _____, coachList, childList] = await Promise.all([
        loadGroup(),
        loadStaff(),
        loadMembers(),
        loadSessions(),
        loadAttendanceStats(),
        listAvailableCoaches(),
        listAvailableChildren(),
      ])
      setCoaches(coachList)
      setChildren(childList)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[groups/detail] loadAll error:', err)
    } finally {
      setLoading(false)
    }
  }, [groupId, loadGroup, loadStaff, loadMembers, loadSessions, loadAttendanceStats])

  useEffect(() => { loadAll() }, [loadAll])

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'infos',     label: 'Infos'     },
    { key: 'joueurs',   label: 'Joueurs',   count: members.length  },
    { key: 'staff',     label: 'Staff',     count: staff.length    },
    { key: 'seances',   label: 'Séances',   count: sessions.length },
    { key: 'formation', label: 'Formation'  },
  ]

  if (loading) {
    return (
      <View style={s.center}>
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      </View>
    )
  }

  if (!group) {
    return (
      <View style={s.center}>
        <AureakText variant="h3" style={{ color: colors.text.muted }}>Groupe introuvable</AureakText>
        <Pressable onPress={() => router.back()} style={{ marginTop: space.md }}>
          <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Retour</AureakText>
        </Pressable>
      </View>
    )
  }

  const methodColor = group.method ? METHOD_COLOR[group.method] : colors.border.light

  return (
    <ScrollView
      nativeID="aureak-group-detail-page"
      style={s.container}
      contentContainerStyle={s.content}
    >

      {/* ── Back ── */}
      <Pressable onPress={() => router.push('/academie/groupes' as never)} style={s.backBtn}>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>← Groupes</AureakText>
      </Pressable>

      {/* ── Hero header ── */}
      <View style={[s.hero, { borderTopColor: methodColor }]}>
        <View style={{ flex: 1 }}>
          <AureakText variant="h2" style={{ marginBottom: 4 }}>{group.name}</AureakText>
          <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Implantation chip */}
            <View style={s.chip}>
              <AureakText variant="caption" style={{ fontSize: 11, color: colors.text.muted }}>
                {group.implantationName}
              </AureakText>
            </View>
            {/* Method */}
            {group.method && (
              <View style={[s.chip, { borderColor: methodColor, backgroundColor: methodColor + '18' }]}>
                <AureakText variant="caption" style={{ fontSize: 11, color: methodColor, fontWeight: '700' }}>
                  {group.method}
                </AureakText>
              </View>
            )}
            {/* Schedule */}
            {group.dayOfWeek && (
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12 }}>
                {group.dayOfWeek}
                {group.startHour !== null ? ` · ${String(group.startHour).padStart(2,'0')}h${String(group.startMinute ?? 0).padStart(2,'0')}` : ''}
                {group.durationMinutes ? ` · ${group.durationMinutes} min` : ''}
              </AureakText>
            )}
          </View>
        </View>
        {/* Staff summary */}
        <View style={s.staffSummary}>
          {STAFF_ROLES.map(r => {
            const assigned = staff.find(s => s.role === r.key)
            return (
              <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[s.roleDot, { backgroundColor: r.color }]} />
                <AureakText variant="caption" style={{ fontSize: 11, color: assigned ? colors.text.dark : colors.text.muted }}>
                  {assigned ? assigned.coachName : 'Non assigné'}
                </AureakText>
              </View>
            )
          })}
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <Pressable
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <AureakText
              variant="caption"
              style={{
                color     : tab === t.key ? colors.accent.gold : colors.text.muted,
                fontWeight: tab === t.key ? '700' : '400',
                fontSize  : 13,
              }}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <AureakText variant="caption" style={{ fontSize: 11, color: colors.text.muted }}>
                  {' '}({t.count})
                </AureakText>
              )}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {/* ── Tab content ── */}
      {tab === 'infos' && (
        <InfosTab
          group={group}
          implantationName={group.implantationName}
          onSaved={loadGroup}
        />
      )}

      {tab === 'joueurs' && (
        <JoueursTab
          groupId={groupId!}
          groupName={group.name}
          members={members}
          membersWithDetails={membersWithDetails}
          attendanceStats={attendanceStats}
          children={children}
          tenantId={tenantId}
          onRefresh={async () => { await loadMembers(); await loadAttendanceStats() }}
          maxPlayers={group.maxPlayers}
        />
      )}

      {tab === 'staff' && (
        <StaffTab
          groupId={groupId!}
          staff={staff}
          coaches={coaches}
          tenantId={tenantId}
          onRefresh={loadStaff}
        />
      )}

      {tab === 'seances' && group && (
        <SeancesTab
          groupId={groupId!}
          group={group}
          sessions={sessions}
          onNewSession={() => router.push('/activites/seances' as never)}
          onRefresh={loadSessions}
        />
      )}

      {/* ── Formation tactique tab (Story 56-2) ── */}
      {tab === 'formation' && group && (
        <TacticalBoard
          members={members}
          formationData={group.formationData ?? undefined}
          saving={formationSaving}
          onSave={async (data: FormationData) => {
            setFormationSaving(true)
            try {
              await updateGroupFormation(group.id, data)
              await loadGroup()
            } catch (err) {
              if (process.env.NODE_ENV !== 'production') console.error('[groups/detail] handleSaveFormation error:', err)
            } finally {
              setFormationSaving(false)
            }
          }}
        />
      )}

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.xl, gap: space.md, maxWidth: 860 },
  center     : { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn    : { paddingBottom: 4 },

  hero       : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderTopWidth : 3,
    borderColor    : colors.border.light,
    padding        : space.md,
    flexDirection  : 'row',
    alignItems     : 'flex-start',
    gap            : space.md,
  },
  chip       : {
    paddingHorizontal: 10,
    paddingVertical  : 3,
    borderRadius     : 12,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.muted,
  },
  staffSummary: {
    gap     : 4,
    minWidth: 160,
    alignItems: 'flex-end' as never,
  },
  roleDot    : { width: 7, height: 7, borderRadius: 4 },

  tabBar     : {
    flexDirection  : 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap            : 0,
  },
  tabBtn     : {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.accent.gold,
  },
})
