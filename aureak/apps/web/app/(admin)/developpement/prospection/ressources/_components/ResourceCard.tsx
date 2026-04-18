// Story 88.5 — ResourceCard : card de téléchargement/lien pour une ressource commerciale
'use client'
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { COMMERCIAL_RESOURCE_TYPE_LABELS, COMMERCIAL_RESOURCE_TYPE_ICONS } from '@aureak/types'
import type { CommercialResource } from '@aureak/types'

type Props = {
  resource     : CommercialResource
  onDownload   : (resource: CommercialResource) => void
  onEdit?      : (resource: CommercialResource) => void
  downloading? : boolean
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function ResourceCard({ resource, onDownload, onEdit, downloading }: Props) {
  const icon = COMMERCIAL_RESOURCE_TYPE_ICONS[resource.resourceType]
  const hasFile = resource.resourceType === 'webpage'
    ? !!resource.externalUrl
    : !!resource.filePath
  const ctaLabel = resource.resourceType === 'webpage' ? 'Ouvrir le lien' : 'Télécharger'

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <AureakText style={s.icon}>{icon}</AureakText>
        <View style={s.headerText}>
          <AureakText variant="label" style={s.title}>{resource.title}</AureakText>
          <AureakText variant="caption" style={s.typeLabel}>
            {COMMERCIAL_RESOURCE_TYPE_LABELS[resource.resourceType]}
          </AureakText>
        </View>
      </View>

      {/* Description */}
      <AureakText variant="body" style={s.description}>
        {resource.description}
      </AureakText>

      {/* Meta */}
      <View style={s.meta}>
        <AureakText variant="caption" style={s.metaText}>
          Mis à jour le {formatDate(resource.updatedAt)}
        </AureakText>
        {resource.fileSize ? (
          <AureakText variant="caption" style={s.metaText}>
            {formatSize(resource.fileSize)}
          </AureakText>
        ) : null}
      </View>

      {/* Actions */}
      <View style={s.actions}>
        {hasFile ? (
          <Pressable
            onPress={() => onDownload(resource)}
            disabled={downloading}
            style={({ pressed }) => [
              s.cta,
              pressed && s.ctaPressed,
              downloading && s.ctaDisabled,
            ] as never}
          >
            <AureakText variant="label" style={s.ctaText}>
              {downloading ? 'Chargement...' : ctaLabel}
            </AureakText>
          </Pressable>
        ) : (
          <View style={s.unavailable}>
            <AureakText variant="caption" style={s.unavailableText}>
              Pas encore disponible
            </AureakText>
          </View>
        )}

        {onEdit ? (
          <Pressable
            onPress={() => onEdit(resource)}
            style={({ pressed }) => [
              s.editBtn,
              pressed && s.editBtnPressed,
            ] as never}
          >
            <AureakText variant="label" style={s.editBtnText}>Modifier</AureakText>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor : colors.light.surface,
    borderRadius    : radius.cardLg,
    padding         : space.lg,
    boxShadow       : shadows.sm,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    minWidth        : 280,
    flex            : 1,
  },
  header: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    marginBottom : space.sm,
  },
  icon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize  : 15,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },
  typeLabel: {
    fontSize : 11,
    color    : colors.text.muted,
    marginTop: 2,
  },
  description: {
    fontSize    : 13,
    color       : colors.text.muted,
    lineHeight  : 18,
    marginBottom: space.md,
  },
  meta: {
    flexDirection: 'row',
    gap          : space.md,
    marginBottom : space.md,
  },
  metaText: {
    fontSize: 11,
    color   : colors.text.muted,
  },
  actions: {
    flexDirection: 'row',
    gap          : space.sm,
    alignItems   : 'center',
  },
  cta: {
    backgroundColor  : colors.accent.gold,
    paddingVertical  : space.xs,
    paddingHorizontal: space.md,
    borderRadius     : radius.card,
  },
  ctaPressed: {
    opacity: 0.8,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize  : 12,
    fontWeight: '700',
    color     : colors.light.surface,
  },
  unavailable: {
    paddingVertical  : space.xs,
    paddingHorizontal: space.md,
    borderRadius     : radius.card,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    opacity          : 0.5,
  },
  unavailableText: {
    fontSize  : 12,
    fontWeight: '600',
    color     : colors.text.muted,
  },
  editBtn: {
    paddingVertical  : space.xs,
    paddingHorizontal: space.sm,
    borderRadius     : radius.card,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  editBtnPressed: {
    opacity: 0.7,
  },
  editBtnText: {
    fontSize  : 12,
    fontWeight: '600',
    color     : colors.text.dark,
  },
})
