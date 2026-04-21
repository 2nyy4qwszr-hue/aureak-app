// Story 58-8 — Timeline visuelle 3 phases de séance pédagogique
// Phases : Activation / Développement / Conclusion
import React from 'react'
import { View, Pressable, useWindowDimensions } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { MethodologySessionModule, MethodologyModuleType } from '@aureak/types'
import { MODULE_LABELS, MODULE_TYPES } from '@aureak/types'

// Couleurs des phases (tokens @aureak/theme colors.phase)
const PHASE_COLORS: Record<MethodologyModuleType, string> = {
  activation : colors.phase.activation,
  development: colors.phase.development,
  conclusion : colors.phase.conclusion,
}

type Props = {
  modules      : MethodologySessionModule[]
  totalDuration: number    // minutes — durée prévue du groupe
  onEditModule : (moduleType: MethodologyModuleType) => void
  readOnly?    : boolean
}

export function SessionTimeline({ modules, totalDuration, onEditModule, readOnly = false }: Props) {
  const { width }   = useWindowDimensions()
  const isDesktop   = width > 768
  const sumDuration = modules.reduce((acc, m) => acc + m.durationMinutes, 0)
  const isOver      = totalDuration > 0 && sumDuration > totalDuration

  // Créer un module "vide" pour les phases manquantes
  const getModule = (type: MethodologyModuleType): MethodologySessionModule | null =>
    modules.find(m => m.moduleType === type) ?? null

  return (
    <View style={{ gap: space.sm }}>
      {/* Indicateur total durée */}
      {totalDuration > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.xs }}>
          <AureakText variant="caption" style={{ color: isOver ? colors.accent.red : colors.text.muted }}>
            {isOver
              ? `⚠ Total dépassé : ${sumDuration} min / ${totalDuration} min prévus`
              : `${sumDuration} min / ${totalDuration} min`
            }
          </AureakText>
        </View>
      )}

      {/* Timeline — flex row desktop, flex column mobile */}
      <View style={{
        flexDirection: isDesktop ? 'row' : 'column',
        gap          : space.xs,
      }}>
        {MODULE_TYPES.map(type => {
          const mod        = getModule(type)
          const label      = MODULE_LABELS[type]
          const phaseColor = PHASE_COLORS[type]
          const duration   = mod?.durationMinutes ?? 0
          const situations = mod?.situations ?? []
          const isEmpty    = !mod || duration === 0
          // Proportion de largeur (desktop) : au moins 80px, proportionnelle à la durée
          const flexRatio  = isDesktop && sumDuration > 0 && duration > 0
            ? Math.max(duration / sumDuration, 0.1)
            : 1

          return (
            <Pressable
              key={type}
              onPress={readOnly ? undefined : () => onEditModule(type)}
              style={{
                flex             : isDesktop ? flexRatio : undefined,
                minWidth         : isDesktop ? 80 : undefined,
                backgroundColor  : isEmpty ? colors.light.muted : phaseColor,
                borderRadius     : 8,
                borderWidth      : isOver && !isEmpty ? 2 : 1,
                borderColor      : isOver && !isEmpty && duration > totalDuration / 3
                  ? colors.accent.red
                  : colors.border.light,
                padding          : space.sm,
                gap              : space.xs,
                cursor           : (readOnly ? 'default' : 'pointer') as never,
              }}
            >
              {/* En-tête phase */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AureakText
                  variant="label"
                  style={{ color: colors.text.dark, fontSize: 10 }}
                >
                  {label.toUpperCase()}
                </AureakText>
                <AureakText
                  variant="caption"
                  style={{ color: duration > 0 ? colors.text.dark : colors.text.muted, fontWeight: '700' as never }}
                >
                  {duration > 0 ? `${duration} min` : '—'}
                </AureakText>
              </View>

              {/* Situations associées (max 2 + ellipsis) */}
              {situations.length > 0 ? (
                <>
                  {situations.slice(0, 2).map(s => (
                    <AureakText
                      key={s.id}
                      variant="caption"
                      style={{ color: colors.text.dark, fontSize: 10 }}
                      numberOfLines={1}
                    >
                      · {s.title}
                    </AureakText>
                  ))}
                  {situations.length > 2 && (
                    <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
                      +{situations.length - 2} autre{situations.length - 2 > 1 ? 's' : ''}…
                    </AureakText>
                  )}
                </>
              ) : (
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10, fontStyle: 'italic' as never }}>
                  {isEmpty ? '— Non configuré —' : 'Aucune situation'}
                </AureakText>
              )}

              {!readOnly && (
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 9, marginTop: space.xs }}>
                  Modifier ›
                </AureakText>
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
