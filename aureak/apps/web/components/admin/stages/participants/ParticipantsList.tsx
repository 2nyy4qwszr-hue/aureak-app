// Story 105.2 — Liste des gardiens inscrits au stage
import { View, Pressable, StyleSheet } from 'react-native'
import type { StageChild } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import { computeAge, formatDateFR } from '../../../../lib/dates'

type Props = {
  participants    : StageChild[]
  loading         : boolean
  onRequestRemove : (childId: string) => void
  onAdd           : () => void
}

export function ParticipantsList({ participants, loading, onRequestRemove, onAdd }: Props) {
  if (loading) {
    return (
      <View style={styles.empty}>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>Chargement des participants…</AureakText>
      </View>
    )
  }

  if (participants.length === 0) {
    return (
      <View style={styles.empty}>
        <AureakText variant="h3" style={{ color: colors.text.dark, textAlign: 'center' }}>
          Aucun gardien inscrit
        </AureakText>
        <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center', marginTop: space.xs }}>
          Ajoute un premier gardien pour commencer la préparation du stage.
        </AureakText>
        <Pressable style={styles.emptyCta} onPress={onAdd}>
          <AureakText variant="caption" style={{ color: colors.text.primary, fontWeight: '700' as never }}>
            + Ajouter un gardien
          </AureakText>
        </Pressable>
      </View>
    )
  }

  const sorted = [...participants].sort((a, b) => {
    const an = (a.nom || a.displayName).toUpperCase()
    const bn = (b.nom || b.displayName).toUpperCase()
    if (an !== bn) return an < bn ? -1 : 1
    return (a.prenom || '').localeCompare(b.prenom || '')
  })

  return (
    <View style={styles.list}>
      <View style={styles.headerRow}>
        <View style={styles.colName}><AureakText variant="caption" style={styles.headerText}>NOM</AureakText></View>
        <View style={styles.colFirst}><AureakText variant="caption" style={styles.headerText}>PRÉNOM</AureakText></View>
        <View style={styles.colDate}><AureakText variant="caption" style={styles.headerText}>DATE DE NAISSANCE</AureakText></View>
        <View style={styles.colAge}><AureakText variant="caption" style={styles.headerText}>ÂGE</AureakText></View>
        <View style={styles.colAction} />
      </View>
      {sorted.map((p) => {
        const age = computeAge(p.birthDate)
        return (
          <View key={p.id} style={styles.row}>
            <View style={styles.colName}>
              <AureakText variant="body" style={{ color: colors.text.dark }}>
                {(p.nom || p.displayName).toUpperCase()}
              </AureakText>
            </View>
            <View style={styles.colFirst}>
              <AureakText variant="body" style={{ color: colors.text.dark }}>
                {p.prenom || '—'}
              </AureakText>
            </View>
            <View style={styles.colDate}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                {formatDateFR(p.birthDate)}
              </AureakText>
            </View>
            <View style={styles.colAge}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                {age !== null ? `${age} ans` : '—'}
              </AureakText>
            </View>
            <View style={styles.colAction}>
              <Pressable style={styles.removeBtn} onPress={() => onRequestRemove(p.id)}>
                <AureakText variant="caption" style={{ color: colors.accent.red }}>
                  Retirer
                </AureakText>
              </Pressable>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  list      : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
  },
  headerRow : {
    flexDirection  : 'row',
    backgroundColor: colors.light.primary,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerText: {
    color     : colors.text.muted,
    fontWeight: '700' as never,
    letterSpacing: 0.5,
    fontSize  : 11,
  },
  row       : {
    flexDirection    : 'row',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    alignItems       : 'center',
  },
  colName   : { flex: 2, paddingRight: space.sm },
  colFirst  : { flex: 2, paddingRight: space.sm },
  colDate   : { flex: 2, paddingRight: space.sm },
  colAge    : { width: 60 },
  colAction : { width: 80, alignItems: 'flex-end' },
  removeBtn : {
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.accent.red,
  },
  empty     : {
    padding         : space.xl,
    alignItems      : 'center',
    justifyContent  : 'center',
    backgroundColor : colors.light.surface,
    borderRadius    : radius.card,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    borderStyle     : 'dashed',
  },
  emptyCta  : {
    marginTop        : space.md,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
})
