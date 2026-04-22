// Story 88.5 — Page Ressources commerciales : 4 cards prédéfinies
'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView, Linking } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { listCommercialResources, getResourceDownloadUrl } from '@aureak/api-client'
import type { CommercialResource } from '@aureak/types'
import { COMMERCIAL_RESOURCE_TYPE_ICONS, COMMERCIAL_RESOURCE_TYPE_LABELS } from '@aureak/types'
import { useAuthStore } from '@aureak/business-logic'
import { UploadResourceModal } from '../../../../../components/admin/prospection/UploadResourceModal'

export default function CommercialResourcesPage() {
  const role = useAuthStore(s => s.role)
  const [resources, setResources] = useState<CommercialResource[]>([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState<CommercialResource | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const isAdmin = role === 'admin'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await listCommercialResources()
      setResources(r)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CommercialResourcesPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleOpen(resource: CommercialResource) {
    try {
      const url = await getResourceDownloadUrl(resource)
      if (!url) return
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        Linking.openURL(url)
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CommercialResourcesPage] open error:', err)
    }
  }

  function handleEdit(resource: CommercialResource) {
    setEditing(resource)
    setModalOpen(true)
  }

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.content}>
      <View style={st.header}>
        <AureakText style={st.title as never}>Ressources commerciales</AureakText>
        <AureakText style={st.sub as never}>
          Documents à jour à envoyer aux prospects. Seul l'admin peut uploader les nouvelles versions.
        </AureakText>
      </View>

      {loading ? (
        <AureakText style={st.loading as never}>Chargement…</AureakText>
      ) : (
        <View style={st.grid}>
          {resources.map(r => {
            const hasContent = r.resourceType === 'webpage' ? !!r.externalUrl : !!r.filePath
            const updated = new Date(r.updatedAt).toLocaleDateString('fr-BE', {
              day: '2-digit', month: 'long', year: 'numeric',
            })
            return (
              <View key={r.id} style={st.card}>
                <View style={st.cardHeader}>
                  <AureakText style={st.icon as never}>{COMMERCIAL_RESOURCE_TYPE_ICONS[r.resourceType]}</AureakText>
                  <View style={st.typeBadge}>
                    <AureakText style={st.typeBadgeLabel as never}>
                      {COMMERCIAL_RESOURCE_TYPE_LABELS[r.resourceType]}
                    </AureakText>
                  </View>
                </View>
                <AureakText style={st.cardTitle as never}>{r.title}</AureakText>
                {r.description && (
                  <AureakText style={st.cardDesc as never}>{r.description}</AureakText>
                )}
                <AureakText style={st.cardMeta as never}>Mis à jour le {updated}</AureakText>

                <View style={st.cardActions}>
                  {hasContent ? (
                    <Pressable style={st.openBtn} onPress={() => handleOpen(r)}>
                      <AureakText style={st.openBtnLabel as never}>
                        {r.resourceType === 'webpage' ? 'Ouvrir le lien' : 'Télécharger'}
                      </AureakText>
                    </Pressable>
                  ) : (
                    <View style={st.unavailable}>
                      <AureakText style={st.unavailableLabel as never}>Pas encore disponible</AureakText>
                    </View>
                  )}
                  {isAdmin && (
                    <Pressable style={st.editBtn} onPress={() => handleEdit(r)}>
                      <AureakText style={st.editBtnLabel as never}>Modifier</AureakText>
                    </Pressable>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      )}

      <UploadResourceModal
        visible={modalOpen}
        resource={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() => load()}
      />
    </ScrollView>
  )
}

const st = StyleSheet.create({
  scroll : { flex: 1, backgroundColor: colors.light.primary },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },

  header: { gap: 4 },
  title : { color: colors.text.dark, fontWeight: '700', fontFamily: fonts.display, fontSize: 26 },
  sub   : { color: colors.text.muted, fontSize: 13 },

  loading: { color: colors.text.muted, fontStyle: 'italic' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card: {
    flex           : 1,
    minWidth       : 280,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    gap            : space.sm,
    // @ts-ignore RN web
    boxShadow      : shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon      : { fontSize: 36 },
  typeBadge : {
    paddingHorizontal: space.sm,
    paddingVertical  : 3,
    backgroundColor  : colors.accent.gold + '22',
    borderRadius     : radius.xs,
  },
  typeBadgeLabel: { color: colors.text.dark, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  cardTitle : { color: colors.text.dark, fontSize: 18, fontWeight: '700', fontFamily: fonts.display },
  cardDesc  : { color: colors.text.muted, fontSize: 13, lineHeight: 18 },
  cardMeta  : { color: colors.text.subtle, fontSize: 11, marginTop: 4 },

  cardActions: { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap', marginTop: space.xs },
  openBtn: {
    paddingHorizontal: space.lg,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
    flex             : 1,
    alignItems       : 'center',
  },
  openBtnLabel: { color: colors.text.dark, fontSize: 13, fontWeight: '700' },

  editBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
  },
  editBtnLabel: { color: colors.text.dark, fontSize: 12, fontWeight: '600' },

  unavailable: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    backgroundColor  : colors.light.muted,
    flex             : 1,
    alignItems       : 'center',
  },
  unavailableLabel: { color: colors.text.muted, fontSize: 12, fontStyle: 'italic' },
})
