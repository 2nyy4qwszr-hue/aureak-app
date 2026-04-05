// Story 56-2 — Tableau tactique terrain : terrain SVG + 11 positions cliquables en 1-4-2-3-1
// RÈGLE : styles uniquement via @aureak/theme tokens
import React, { useState } from 'react'
import { View, Pressable, StyleSheet, Modal, ScrollView, TextInput } from 'react-native'
import { colors, space, radius } from '@aureak/theme'
import type { GroupMemberWithName } from '@aureak/types'
import { AureakText } from './components/Text'

// ── Types ──────────────────────────────────────────────────────────────────────

/** FormationData : position_key → childId (null = vide) */
export type FormationData = Record<string, string | null>

export interface TacticalBoardProps {
  members      : GroupMemberWithName[]
  formationData?: FormationData
  onSave       : (data: FormationData) => void
  saving?      : boolean
}

// ── Formation 1-4-2-3-1 ────────────────────────────────────────────────────────
// Coordonnées en % (x: 0=gauche, 100=droite | y: 0=haut, 100=bas)
// Terrain portrait 400×600 — vue du dessus depuis l'attaque (haut)

type PositionDef = {
  key  : string
  label: string
  x    : number   // % de la largeur
  y    : number   // % de la hauteur
}

const FORMATION_1_4_2_3_1: PositionDef[] = [
  // Gardien — bas du terrain (zone défensive en vue attaquant-vers-bas)
  { key: 'GK',   label: 'GK',  x: 50, y: 88 },
  // Défenseurs
  { key: 'LB',   label: 'LB',  x: 18, y: 72 },
  { key: 'DC_L', label: 'DCg', x: 35, y: 72 },
  { key: 'DC_R', label: 'DCd', x: 65, y: 72 },
  { key: 'RB',   label: 'RB',  x: 82, y: 72 },
  // Milieux défensifs
  { key: 'CM_L', label: 'MDg', x: 35, y: 54 },
  { key: 'CM_R', label: 'MDd', x: 65, y: 54 },
  // Milieux offensifs / ailiers
  { key: 'LW',   label: 'AG',  x: 15, y: 36 },
  { key: 'CAM',  label: 'MOC', x: 50, y: 36 },
  { key: 'RW',   label: 'AD',  x: 85, y: 36 },
  // Attaquant de pointe
  { key: 'ST',   label: 'BU',  x: 50, y: 14 },
]

// ── Terrain SVG ────────────────────────────────────────────────────────────────

function PitchSVG() {
  // Éléments SVG en React natif web (pas react-native-svg)
  // @ts-ignore
  const Svg    = 'svg'    as unknown as React.ComponentType<React.SVGProps<SVGSVGElement>>
  // @ts-ignore
  const Rect   = 'rect'   as unknown as React.ComponentType<React.SVGProps<SVGRectElement>>
  // @ts-ignore
  const Line   = 'line'   as unknown as React.ComponentType<React.SVGProps<SVGLineElement>>
  // @ts-ignore
  const Circle = 'circle' as unknown as React.ComponentType<React.SVGProps<SVGCircleElement>>
  // @ts-ignore
  const Ellipse = 'ellipse' as unknown as React.ComponentType<React.SVGProps<SVGEllipseElement>>

  return (
    <View style={ps.container}>
      {/* @ts-ignore */}
      <Svg width="100%" height="100%" viewBox="0 0 400 600" style={{ display: 'block' }}>
        {/* Fond terrain */}
        {/* @ts-ignore */}
        <Rect width={400} height={600} fill="#2D7A2D" rx={6} />
        {/* Rayures */}
        {/* @ts-ignore */}
        <Rect x={0}   y={0} width={50} height={600} fill="#2A6E2A" opacity={0.6} />
        {/* @ts-ignore */}
        <Rect x={100} y={0} width={50} height={600} fill="#2A6E2A" opacity={0.6} />
        {/* @ts-ignore */}
        <Rect x={200} y={0} width={50} height={600} fill="#2A6E2A" opacity={0.6} />
        {/* @ts-ignore */}
        <Rect x={300} y={0} width={50} height={600} fill="#2A6E2A" opacity={0.6} />
        {/* Bordure terrain */}
        {/* @ts-ignore */}
        <Rect x={10} y={10} width={380} height={580} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={2} rx={3} />
        {/* Ligne médiane */}
        {/* @ts-ignore */}
        <Line x1={10} y1={300} x2={390} y2={300} stroke="rgba(255,255,255,0.75)" strokeWidth={2} />
        {/* Cercle central */}
        {/* @ts-ignore */}
        <Circle cx={200} cy={300} r={60} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={2} />
        {/* @ts-ignore */}
        <Circle cx={200} cy={300} r={4}  fill="rgba(255,255,255,0.85)" />
        {/* Surface de réparation haut (défenseur) */}
        {/* @ts-ignore */}
        <Rect x={90} y={10} width={220} height={110} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={1.5} />
        {/* Surface de but haut */}
        {/* @ts-ignore */}
        <Rect x={145} y={10} width={110} height={45} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={1.5} />
        {/* Point penalty haut */}
        {/* @ts-ignore */}
        <Circle cx={200} cy={82} r={3} fill="rgba(255,255,255,0.85)" />
        {/* Arc surface haut */}
        {/* @ts-ignore */}
        <Ellipse cx={200} cy={120} rx={62} ry={30} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
        {/* Surface de réparation bas (attaquant) */}
        {/* @ts-ignore */}
        <Rect x={90} y={480} width={220} height={110} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={1.5} />
        {/* Surface de but bas */}
        {/* @ts-ignore */}
        <Rect x={145} y={545} width={110} height={45} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={1.5} />
        {/* Point penalty bas */}
        {/* @ts-ignore */}
        <Circle cx={200} cy={518} r={3} fill="rgba(255,255,255,0.85)" />
        {/* Arc surface bas */}
        {/* @ts-ignore */}
        <Ellipse cx={200} cy={480} rx={62} ry={30} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
        {/* Arcs de coin */}
        {/* @ts-ignore */}
        <Ellipse cx={10}  cy={10}  rx={14} ry={14} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
        {/* @ts-ignore */}
        <Ellipse cx={390} cy={10}  rx={14} ry={14} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
        {/* @ts-ignore */}
        <Ellipse cx={10}  cy={590} rx={14} ry={14} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
        {/* @ts-ignore */}
        <Ellipse cx={390} cy={590} rx={14} ry={14} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      </Svg>
    </View>
  )
}

// ── Composant principal ────────────────────────────────────────────────────────

export function TacticalBoard({ members, formationData, onSave, saving }: TacticalBoardProps) {
  const [formation, setFormation] = useState<FormationData>(formationData ?? {})
  const [modalPos,  setModalPos]  = useState<PositionDef | null>(null)
  const [modalMode, setModalMode] = useState<'assign' | 'reassign'>('assign')
  const [search,    setSearch]    = useState('')

  // Map childId → displayName pour affichage rapide
  const memberMap = React.useMemo(() => {
    const m: Record<string, string> = {}
    for (const mem of members) m[mem.childId] = mem.displayName
    return m
  }, [members])

  // Joueurs déjà assignés à une position
  const assignedChildIds = new Set(Object.values(formation).filter(Boolean) as string[])

  // Joueurs disponibles pour une nouvelle assignation
  const available = members.filter(m => !assignedChildIds.has(m.childId))

  // Recherche dans la liste
  const searchLower   = search.toLowerCase()
  const filteredMembers = (modalMode === 'assign' ? available : members).filter(m =>
    !search || m.displayName.toLowerCase().includes(searchLower)
  )

  const handleOpenPosition = (pos: PositionDef) => {
    const isAssigned = !!formation[pos.key]
    setModalMode(isAssigned ? 'reassign' : 'assign')
    setSearch('')
    setModalPos(pos)
  }

  const handleAssign = (childId: string) => {
    setFormation(prev => ({ ...prev, [modalPos!.key]: childId }))
    setModalPos(null)
  }

  const handleRemove = () => {
    setFormation(prev => ({ ...prev, [modalPos!.key]: null }))
    setModalPos(null)
  }

  const handleSave = () => {
    onSave(formation)
  }

  return (
    <View style={tb.wrapper}>
      <AureakText variant="label" style={tb.title}>Formation tactique</AureakText>
      <AureakText variant="caption" style={tb.subtitle}>
        Formation 1-4-2-3-1 — touchez une position pour assigner un joueur
      </AureakText>

      {/* ── Terrain + marqueurs positions ── */}
      <View style={tb.pitchContainer}>
        <PitchSVG />

        {/* Marqueurs de position */}
        {FORMATION_1_4_2_3_1.map(pos => {
          const childId   = formation[pos.key] ?? null
          const name      = childId ? memberMap[childId] : null
          const initials  = name
            ? (() => {
                const parts = name.trim().split(/\s+/)
                return parts.length >= 2
                  ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                  : name.slice(0, 2).toUpperCase()
              })()
            : null
          const isAssigned = !!childId

          return (
            <Pressable
              key={pos.key}
              style={[
                tb.marker,
                {
                  left: `${pos.x}%` as never,
                  top : `${pos.y}%` as never,
                  backgroundColor: isAssigned ? colors.accent.gold : 'rgba(255,255,255,0.25)',
                  borderColor    : isAssigned ? colors.accent.goldLight : 'rgba(255,255,255,0.7)',
                },
              ]}
              onPress={() => handleOpenPosition(pos)}
              accessibilityLabel={`Position ${pos.label}${name ? ` : ${name}` : ' vide'}`}
            >
              {isAssigned && initials ? (
                <AureakText variant="caption" style={tb.markerInitials}>{initials}</AureakText>
              ) : (
                <AureakText variant="caption" style={tb.markerLabel}>{pos.label}</AureakText>
              )}
            </Pressable>
          )
        })}
      </View>

      {/* ── Bouton Sauvegarder ── */}
      <Pressable
        style={[tb.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
          {saving ? 'Sauvegarde…' : 'Sauvegarder la formation'}
        </AureakText>
      </Pressable>

      {/* ── Légende ── */}
      <View style={tb.legend}>
        <View style={[tb.legendDot, { backgroundColor: colors.accent.gold }]} />
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>Position assignée</AureakText>
        <View style={[tb.legendDot, { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'rgba(0,0,0,0.2)', borderWidth: 1 }]} />
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>Position vide</AureakText>
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginLeft: 4 }}>
          {Object.values(formation).filter(Boolean).length}/{FORMATION_1_4_2_3_1.length} assignés
        </AureakText>
      </View>

      {/* ── Modal sélection / ré-assignation joueur ── */}
      <Modal visible={!!modalPos} transparent animationType="fade">
        <Pressable style={tb.overlay} onPress={() => setModalPos(null)}>
          <Pressable style={tb.modal} onPress={e => e.stopPropagation?.()}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
              <AureakText variant="h3" style={{ color: colors.text.dark, fontSize: 15 }}>
                {modalMode === 'assign'
                  ? `Assigner — ${modalPos?.label}`
                  : `Modifier — ${modalPos?.label}`}
              </AureakText>
              <Pressable onPress={() => setModalPos(null)}>
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 18 }}>✕</AureakText>
              </Pressable>
            </View>

            {modalMode === 'reassign' && modalPos && formation[modalPos.key] && (
              <>
                <View style={tb.currentRow}>
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>Actuellement : </AureakText>
                  <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                    {memberMap[formation[modalPos.key]!] ?? 'Joueur inconnu'}
                  </AureakText>
                </View>
                <Pressable style={tb.removeBtn} onPress={handleRemove}>
                  <AureakText variant="caption" style={{ color: colors.status.absent, fontWeight: '700' }}>
                    Retirer de cette position
                  </AureakText>
                </Pressable>
                <View style={tb.divider} />
                <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: space.xs }}>
                  Changer de joueur :
                </AureakText>
              </>
            )}

            <TextInput
              style={tb.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un joueur…"
              placeholderTextColor={colors.text.muted}
            />

            <ScrollView style={tb.memberList}>
              {filteredMembers.length === 0 ? (
                <AureakText variant="caption" style={{ color: colors.text.muted, padding: space.sm, fontStyle: 'italic' as never }}>
                  {modalMode === 'assign'
                    ? 'Tous les joueurs sont déjà assignés.'
                    : 'Aucun joueur disponible.'}
                </AureakText>
              ) : (
                filteredMembers.map(m => (
                  <Pressable
                    key={m.childId}
                    style={tb.memberOption}
                    onPress={() => handleAssign(m.childId)}
                  >
                    <View style={tb.memberAvatar}>
                      <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '800', fontSize: 11 }}>
                        {m.displayName.charAt(0).toUpperCase()}
                      </AureakText>
                    </View>
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontSize: 13 }}>
                      {m.displayName}
                    </AureakText>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const MARKER_SIZE = 36

const tb = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    gap            : space.sm,
  },
  title: {
    color      : colors.text.muted,
    fontWeight : '700',
    fontSize   : 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as never,
  },
  subtitle: {
    color    : colors.text.muted,
    fontSize : 11,
    marginTop: -4,
  },
  pitchContainer: {
    width         : '100%' as never,
    aspectRatio   : 400 / 600,
    position      : 'relative',
    borderRadius  : 6,
    overflow      : 'hidden',
    alignSelf     : 'center',
    maxWidth      : 380,
  },
  marker: {
    position     : 'absolute' as never,
    width        : MARKER_SIZE,
    height       : MARKER_SIZE,
    borderRadius : MARKER_SIZE / 2,
    alignItems   : 'center',
    justifyContent: 'center',
    borderWidth  : 2,
    marginLeft   : -(MARKER_SIZE / 2),
    marginTop    : -(MARKER_SIZE / 2),
    zIndex       : 10,
  },
  markerInitials: {
    color     : colors.text.dark,
    fontWeight: '800',
    fontSize  : 11,
    lineHeight: 13,
  },
  markerLabel: {
    color     : 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    fontSize  : 9,
    lineHeight: 11,
  },
  saveBtn: {
    backgroundColor  : colors.accent.gold,
    borderRadius     : radius.xs,
    paddingVertical  : space.sm,
    alignItems       : 'center',
    marginTop        : space.xs,
  },
  legend: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 6,
    flexWrap     : 'wrap',
  },
  legendDot: {
    width        : 10,
    height       : 10,
    borderRadius : 5,
  },
  // Modal
  overlay: {
    flex           : 1,
    backgroundColor: colors.overlay.dark,
    justifyContent : 'center',
    alignItems     : 'center',
    padding        : space.xl,
  },
  modal: {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    padding        : space.md,
    width          : '100%',
    maxWidth       : 400,
    maxHeight      : 500,
  },
  currentRow: {
    flexDirection   : 'row',
    alignItems      : 'center',
    gap             : 4,
    marginBottom    : space.sm,
  },
  removeBtn: {
    paddingVertical : space.xs,
    paddingHorizontal: space.sm,
    backgroundColor : colors.status.absent + '15',
    borderRadius    : radius.xs,
    borderWidth     : 1,
    borderColor     : colors.status.absent + '40',
    alignItems      : 'center',
    marginBottom    : space.sm,
  },
  divider: {
    height         : 1,
    backgroundColor: colors.border.divider,
    marginBottom   : space.sm,
  },
  searchInput: {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs + 2,
    color            : colors.text.dark,
    fontSize         : 13,
    marginBottom     : space.xs,
  },
  memberList: {
    maxHeight: 240,
  },
  memberOption: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    paddingVertical: space.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  memberAvatar: {
    width          : 28,
    height         : 28,
    borderRadius   : 14,
    backgroundColor: colors.light.muted,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    alignItems     : 'center',
    justifyContent : 'center',
  },
})

const ps = StyleSheet.create({
  container: {
    width : '100%' as never,
    height: '100%' as never,
  },
})
